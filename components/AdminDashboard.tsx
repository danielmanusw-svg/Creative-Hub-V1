import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

interface FirestoreStrategy {
    id: string;
    product: string;
    format: string;
    batchCode?: string;
    description: string;
}

interface FirestoreVariant {
    id: string;
    strategyId: string;
    headerId: string;
    name: string;
    status: string;
    createdDate: string;
    launchDate?: string;
    reviewDate?: string;
    editDate?: string;
    compDate?: string;
    landingPage?: string;
    target?: string;
    concept?: string;
    scriptLink?: string;
    videoLink?: string;
    reviewStatus?: string;
    rejectionHistory?: any[];
}

const AdminDashboard: React.FC = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [strategies, setStrategies] = useState<FirestoreStrategy[]>([]);
    const [variants, setVariants] = useState<FirestoreVariant[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isUnlocked) return;

        // Listen to strategies collection
        const unsubStrategies = onSnapshot(
            collection(db, 'strategies'),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FirestoreStrategy));
                setStrategies(data);
                setIsConnected(true);
                setError(null);
            },
            (err) => {
                console.error('Error fetching strategies:', err);
                setError(err.message);
                setIsConnected(false);
            }
        );

        // Listen to variants collection
        const unsubVariants = onSnapshot(
            collection(db, 'variants'),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FirestoreVariant));
                setVariants(data);
            },
            (err) => {
                console.error('Error fetching variants:', err);
                setError(err.message);
            }
        );

        return () => {
            unsubStrategies();
            unsubVariants();
        };
    }, [isUnlocked]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'Brosantis') {
            setIsUnlocked(true);
            setPasswordInput('');
        } else {
            alert('Incorrect password');
            setPasswordInput('');
        }
    };

    if (!isUnlocked) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-96">
                    <div className="text-center mb-6">
                        <i className="fa-solid fa-lock text-4xl text-indigo-600 mb-4"></i>
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-wider">Admin Access</h2>
                        <p className="text-sm text-gray-500 mt-2">Enter password to view database</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-mono text-lg"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-wider"
                        >
                            Unlock
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[98%] mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <i className="fa-solid fa-database text-indigo-600 text-2xl"></i>
                        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-wider">Database Visualizer</h1>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-bold ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                            Firebase Connection: {isConnected ? 'Active' : 'Disconnected'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-700 font-medium">
                            <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                            Error: {error}
                        </p>
                    </div>
                )}
            </div>

            {/* Split View */}
            <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Strategies */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider">
                            <i className="fa-solid fa-folder text-indigo-600 mr-2"></i>
                            Strategies Collection
                        </h2>
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
                            {strategies.length} docs
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {strategies.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <i className="fa-solid fa-inbox text-4xl mb-3"></i>
                                <p className="text-sm font-medium">No strategies found</p>
                            </div>
                        ) : (
                            strategies.map((strategy) => (
                                <div key={strategy.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            ID: {strategy.id}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-500 w-24">Product:</span>
                                            <span className="text-gray-800 font-medium">{strategy.product}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-500 w-24">Format:</span>
                                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
                                                {strategy.format}
                                            </span>
                                        </div>
                                        {strategy.batchCode && (
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-gray-500 w-24">Batch:</span>
                                                <span className="text-gray-800">{strategy.batchCode}</span>
                                            </div>
                                        )}
                                        {strategy.description && (
                                            <div className="flex items-start space-x-2 mt-2">
                                                <span className="font-bold text-gray-500 w-24">Description:</span>
                                                <span className="text-gray-600 text-xs flex-1">{strategy.description}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column - Variants */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider">
                            <i className="fa-solid fa-list text-rose-600 mr-2"></i>
                            Variants Collection
                        </h2>
                        <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">
                            {variants.length} docs
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {variants.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <i className="fa-solid fa-inbox text-4xl mb-3"></i>
                                <p className="text-sm font-medium">No variants found</p>
                            </div>
                        ) : (
                            variants.map((variant) => (
                                <div key={variant.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-rose-300 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            ID: {variant.id}
                                        </span>
                                        <span className="text-xs font-mono bg-indigo-50 px-2 py-1 rounded text-indigo-700">
                                            Strategy: {variant.strategyId.substring(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-500 w-24">Name:</span>
                                            <span className="text-gray-800 font-medium">{variant.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-500 w-24">Status:</span>
                                            <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-xs font-bold">
                                                {variant.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-500 w-24">Created:</span>
                                            <span className="text-gray-600 text-xs">{variant.createdDate}</span>
                                        </div>
                                        {variant.concept && (
                                            <div className="flex items-start space-x-2 mt-2">
                                                <span className="font-bold text-gray-500 w-24">Concept:</span>
                                                <span className="text-gray-600 text-xs flex-1">{variant.concept}</span>
                                            </div>
                                        )}
                                        {variant.scriptLink && (
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-gray-500 w-24">Script:</span>
                                                <a href={variant.scriptLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs underline">
                                                    View Link
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
