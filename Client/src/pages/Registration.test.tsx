import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Registration from './Registration';

describe('Registration', () => {
    const onRegisterSuccess = vi.fn();
    const onToggleView = vi.fn();

    beforeEach(() => {
        onRegisterSuccess.mockReset();
        onToggleView.mockReset();
        vi.stubGlobal('alert', vi.fn());
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function renderRegistration() {
        render(<Registration onRegisterSuccess={onRegisterSuccess} onToggleView={onToggleView} />);
    }

    async function fillPasswords(password: string, confirmPassword: string) {
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/^password:/i), password);
        await user.type(screen.getByLabelText(/confirm password/i), confirmPassword);
        return user;
    }

    it('blocks submission and alerts when passwords do not match', async () => {
        renderRegistration();
        const user = await fillPasswords('secret123', 'different456');
        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');

        await user.click(screen.getByRole('button', { name: /sign up/i }));

        expect(window.alert).toHaveBeenCalledWith('Passwords do not match!');
        expect(fetch).not.toHaveBeenCalled();
        expect(onRegisterSuccess).not.toHaveBeenCalled();
    });

    it('registers successfully, normalising allergies and diet focus, and notifies the parent', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

        renderRegistration();
        const user = await fillPasswords('secret123', 'secret123');
        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(screen.getByLabelText(/allergies/i), 'nuts, dairy');
        await user.type(screen.getByLabelText(/dietary preference/i), 'vegan');

        await user.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => expect(onRegisterSuccess).toHaveBeenCalledTimes(1));
        expect(window.alert).toHaveBeenCalledWith('Registration successful! Please log in.');
        expect(fetch).toHaveBeenCalledWith(
            '/api/auth/register',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    email: 'user@example.com',
                    password: 'secret123',
                    allergies: ['NUTS', 'DAIRY'],
                    preference: 'VEGAN',
                }),
            })
        );
    });

    it('shows the server error and does not proceed when registration fails', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            text: async () => 'Email already registered',
        });

        renderRegistration();
        const user = await fillPasswords('secret123', 'secret123');
        await user.type(screen.getByLabelText(/email address/i), 'taken@example.com');

        await user.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Email already registered'));
        expect(onRegisterSuccess).not.toHaveBeenCalled();
    });

    it('switches back to the login view when "Login here" is clicked', async () => {
        renderRegistration();
        const user = userEvent.setup();

        await user.click(screen.getByText(/login here/i));

        expect(onToggleView).toHaveBeenCalledTimes(1);
    });
});
