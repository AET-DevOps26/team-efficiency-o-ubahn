import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

type FetchResponse = { ok: boolean; status?: number; json?: () => Promise<unknown>; text?: () => Promise<unknown> };

function setupFetchMock(handlers: {
    inventory?: FetchResponse;
    preferences?: FetchResponse;
    favourites?: FetchResponse;
    onAddItem?: (body: Record<string, unknown>) => FetchResponse;
    onDeleteItem?: (id: string) => FetchResponse;
    onGenerate?: () => FetchResponse;
    onToggleFavourite?: (method: string, recipeId: string) => FetchResponse;
} = {}) {
    const fetchMock = vi.fn(async (input: unknown, init: RequestInit = {}) => {
        const url = String(input);
        const method = (init.method ?? 'GET').toUpperCase();

        if (method === 'GET' && url === '/api/inventory') {
            return handlers.inventory ?? { ok: true, json: async () => [] };
        }
        if (method === 'GET' && url === '/api/preferences/me') {
            return handlers.preferences ?? { ok: true, json: async () => ({ allergies: [], dietFocus: '' }) };
        }
        if (method === 'GET' && url === '/api/recipes/favourites') {
            return handlers.favourites ?? { ok: true, json: async () => [] };
        }
        if (method === 'POST' && url === '/api/inventory/items') {
            const body = JSON.parse(String(init.body));
            return handlers.onAddItem ? handlers.onAddItem(body) : { ok: true, json: async () => ({ id: 1, ...body }) };
        }
        const deleteItemMatch = url.match(/^\/api\/inventory\/items\/(\d+)$/);
        if (method === 'DELETE' && deleteItemMatch) {
            return handlers.onDeleteItem ? handlers.onDeleteItem(deleteItemMatch[1]) : { ok: true };
        }
        if (method === 'POST' && url === '/api/recipes/generate') {
            return handlers.onGenerate
                ? handlers.onGenerate()
                : { ok: true, json: async () => ({ id: 1, title: 'Mock Recipe', instructions: 'Do it.' }) };
        }
        const favMatch = url.match(/^\/api\/recipes\/(\d+)\/favourite$/);
        if (favMatch) {
            return handlers.onToggleFavourite
                ? handlers.onToggleFavourite(method, favMatch[1])
                : {
                      ok: true,
                      json: async () => ({
                          id: 1,
                          userEmail: 'user@example.com',
                          recipe: { id: Number(favMatch[1]), title: 'Mock Recipe', instructions: 'Do it.' },
                      }),
                  };
        }

        throw new Error(`Unhandled fetch in test: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function farFutureDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
}

describe('Dashboard', () => {
    beforeEach(() => {
        localStorage.setItem('fridgeai_token', 'fake-token');
        vi.stubGlobal('alert', vi.fn());
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, reload: vi.fn() },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it('loads and displays the inventory on mount', async () => {
        setupFetchMock({
            inventory: {
                ok: true,
                json: async () => [
                    { id: 1, name: 'Garlic', quantity: 3, unit: 'CLOVE', expiryDate: farFutureDate() },
                ],
            },
        });

        render(<Dashboard />);

        expect(await screen.findByText('Garlic')).toBeInTheDocument();
    });

    it('shows an error message when the inventory fails to load', async () => {
        setupFetchMock({ inventory: { ok: false, status: 500 } });

        render(<Dashboard />);

        expect(await screen.findByText(/could not load your inventory/i)).toBeInTheDocument();
    });

    it('adds a new ingredient through the "+ Add Item" form', async () => {
        setupFetchMock();
        render(<Dashboard />);
        const user = userEvent.setup();

        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await user.click(screen.getByRole('button', { name: /\+ add item/i }));

        await user.type(screen.getByLabelText(/ingredient name/i), 'Basil');
        await user.clear(screen.getByLabelText(/quantity/i));
        await user.type(screen.getByLabelText(/quantity/i), '2');
        await user.type(screen.getByLabelText(/expiration date/i), farFutureDate());
        await user.click(screen.getByRole('button', { name: /confirm add/i }));

        expect(await screen.findByText('Basil')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /confirm add/i })).not.toBeInTheDocument();
    });

    it('removes an ingredient when its delete button is clicked', async () => {
        setupFetchMock({
            inventory: {
                ok: true,
                json: async () => [
                    { id: 1, name: 'Garlic', quantity: 3, unit: 'CLOVE', expiryDate: farFutureDate() },
                ],
            },
        });
        render(<Dashboard />);
        const user = userEvent.setup();

        expect(await screen.findByText('Garlic')).toBeInTheDocument();
        await user.click(screen.getByTitle('Remove item'));

        await waitFor(() => expect(screen.queryByText('Garlic')).not.toBeInTheDocument());
    });

    it('generates a recipe and allows favouriting it', async () => {
        setupFetchMock();
        render(<Dashboard />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: /auto-generate meals/i }));

        expect(await screen.findByText('Mock Recipe')).toBeInTheDocument();

        await user.click(screen.getByTitle('Add to Favorites'));

        expect(await screen.findByText(/favorites \(1\)/i)).toBeInTheDocument();
    });

    it('signs the user out and clears the stored token', async () => {
        setupFetchMock();
        render(<Dashboard />);
        const user = userEvent.setup();

        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await user.click(screen.getByRole('button', { name: /sign out/i }));

        expect(localStorage.getItem('fridgeai_token')).toBeNull();
        expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
});
