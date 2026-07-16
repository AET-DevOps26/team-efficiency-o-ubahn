import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';

describe('Login', () => {
    const onLoginSuccess = vi.fn();
    const onToggleView = vi.fn();

    beforeEach(() => {
        onLoginSuccess.mockReset();
        onToggleView.mockReset();
        localStorage.clear();
        vi.stubGlobal('alert', vi.fn());
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function renderLogin() {
        render(<Login onLoginSuccess={onLoginSuccess} onToggleView={onToggleView} />);
    }

    it('logs in successfully, stores the token, and notifies the parent', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'jwt-token-123' }),
        });

        renderLogin();
        const user = userEvent.setup();

        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(screen.getByLabelText(/password/i), 'secret123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1));
        expect(localStorage.getItem('fridgeai_token')).toBe('jwt-token-123');
        expect(fetch).toHaveBeenCalledWith(
            '/api/auth/login',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ email: 'user@example.com', password: 'secret123' }),
            })
        );
    });

    it('shows an error and does not authenticate when credentials are invalid', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

        renderLogin();
        const user = userEvent.setup();

        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(screen.getByLabelText(/password/i), 'wrong-password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Invalid email or password'));
        expect(onLoginSuccess).not.toHaveBeenCalled();
        expect(localStorage.getItem('fridgeai_token')).toBeNull();
    });

    it('switches to the registration view when "Register here" is clicked', async () => {
        renderLogin();
        const user = userEvent.setup();

        await user.click(screen.getByText(/register here/i));

        expect(onToggleView).toHaveBeenCalledTimes(1);
    });
});
