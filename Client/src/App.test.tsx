import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./pages/Dashboard', () => ({
    default: () => <div>DASHBOARD_MOCK</div>,
}));

function makeToken(expSecondsFromNow: number): string {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }));
    return `header.${payload}.signature`;
}

describe('App', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal('alert', vi.fn());
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shows the login form when there is no stored token', () => {
        render(<App />);

        expect(screen.getByRole('heading', { name: /fridgeai login/i })).toBeInTheDocument();
        expect(screen.queryByText('DASHBOARD_MOCK')).not.toBeInTheDocument();
    });

    it('shows the login form and clears the token when the stored token is expired', () => {
        localStorage.setItem('fridgeai_token', makeToken(-60));

        render(<App />);

        expect(screen.getByRole('heading', { name: /fridgeai login/i })).toBeInTheDocument();
        expect(localStorage.getItem('fridgeai_token')).toBeNull();
    });

    it('shows the dashboard directly when a valid token is already stored', () => {
        localStorage.setItem('fridgeai_token', makeToken(3600));

        render(<App />);

        expect(screen.getByText('DASHBOARD_MOCK')).toBeInTheDocument();
    });

    it('switches to the registration view and back via the toggle links', async () => {
        render(<App />);
        const user = userEvent.setup();

        await user.click(screen.getByText(/register here/i));
        expect(screen.getByRole('heading', { name: /fridgeai register/i })).toBeInTheDocument();

        await user.click(screen.getByText(/login here/i));
        expect(screen.getByRole('heading', { name: /fridgeai login/i })).toBeInTheDocument();
    });

    it('renders the dashboard after a successful login', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: makeToken(3600) }),
        });

        render(<App />);
        const user = userEvent.setup();

        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(screen.getByLabelText(/password/i), 'secret123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(screen.getByText('DASHBOARD_MOCK')).toBeInTheDocument());
    });
});
