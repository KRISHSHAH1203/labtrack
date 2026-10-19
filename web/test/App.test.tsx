import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { Api } from '../src/api/client';
import { Sample } from '../src/types';

function fakeApi(): Api {
  let samples: Sample[] = [];
  return {
    list: jest.fn(async () => ({ items: samples, total: samples.length })),
    create: jest.fn(async (input) => {
      if (samples.some((s) => s.code === input.code)) throw new Error(`Sample code ${input.code} already exists`);
      const s: Sample = { id: String(samples.length + 1), status: 'RECEIVED', createdAt: '', ...input };
      samples = [s, ...samples];
      return s;
    }),
    advance: jest.fn(async (id, status) => {
      samples = samples.map((s) => (s.id === id ? { ...s, status } : s));
      return samples.find((s) => s.id === id)!;
    }),
  };
}

describe('App', () => {
  it('registers a sample and moves it through the workflow', async () => {
    const api = fakeApi();
    render(<App api={api} />);
    expect(await screen.findByText('No samples yet.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Sample code'), 's-100');
    await userEvent.type(screen.getByLabelText('Study ID'), 'TOX-12');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('S-100')).toBeInTheDocument();
    expect(screen.getByText('Received')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Move S-100 to In analysis' }));
    await waitFor(() => expect(screen.getByText('In analysis')).toBeInTheDocument());
  });

  it('shows the server error when registration fails', async () => {
    const api = fakeApi();
    render(<App api={api} />);
    const register = async () => {
      await userEvent.type(screen.getByLabelText('Sample code'), 'S-1');
      await userEvent.clear(screen.getByLabelText('Study ID'));
      await userEvent.type(screen.getByLabelText('Study ID'), 'A');
      await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    };
    await register();
    expect(await screen.findByText('S-1')).toBeInTheDocument();
    await register();
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });
});
