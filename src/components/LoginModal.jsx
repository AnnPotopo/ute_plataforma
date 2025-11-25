import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { X } from 'lucide-react';
import { auth } from '../firebase'; // Importamos auth

const LoginModal = ({ onLogin, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        // Backdoors demo
        if (email === 'admin@ute.edu.mx' && password === 'admin123') return onLogin({ uid: 'admin-demo', email, role: 'admin', name: 'Admin Demo' });
        if (email === 'chofer@ute.edu.mx') return onLogin({ uid: 'chofer-demo', email, role: 'chofer', name: 'Chofer Demo' });

        try {
            const uc = await signInWithEmailAndPassword(auth, email, password);
            onLogin({ uid: uc.user.uid, email: uc.user.email, role: 'alumno', name: 'Usuario UTE' });
        } catch (err) {
            setError('Credenciales inválidas');
        }
    };

    return (
        <div className="fixed inset-0 bg-emerald-900/40 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative border-t-8 border-emerald-600">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-center mb-6">Acceso UTE</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" className="w-full p-3 border rounded-lg" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full p-3 border rounded-lg" />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-lg font-bold">Ingresar</button>
                </form>
            </div>
        </div>
    );
};
export default LoginModal;