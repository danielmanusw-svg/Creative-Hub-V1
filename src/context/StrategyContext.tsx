import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StrategyItem, Variant } from '../../types';

interface StrategyContextType {
    strategies: StrategyItem[];
    loading: boolean;
    error: string | null;
    addStrategy: (strategy: Omit<StrategyItem, 'id' | 'variants'>) => Promise<string>;
    addVariant: (variant: Omit<Variant, 'id'>, strategyId: string) => Promise<string>;
    updateVariant: (variantId: string, updates: Partial<Variant>) => Promise<void>;
    deleteStrategy: (id: string) => Promise<void>;
    deleteVariant: (id: string) => Promise<void>;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export const useStrategy = () => {
    const context = useContext(StrategyContext);
    if (!context) {
        throw new Error('useStrategy must be used within a StrategyProvider');
    }
    return context;
};

interface StrategyProviderProps {
    children: ReactNode;
}

export const StrategyProvider: React.FC<StrategyProviderProps> = ({ children }) => {
    const [strategiesData, setStrategiesData] = useState<StrategyItem[]>([]);
    const [variantsData, setVariantsData] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen to strategies collection
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'strategies'),
            (snapshot) => {
                const strategiesFromDb = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    variants: [] // Will be populated by join
                })) as StrategyItem[];
                setStrategiesData(strategiesFromDb);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching strategies:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Listen to variants collection
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'variants'),
            (snapshot) => {
                const variantsFromDb = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Variant[];
                setVariantsData(variantsFromDb);
            },
            (err) => {
                console.error('Error fetching variants:', err);
                setError(err.message);
            }
        );

        return () => unsubscribe();
    }, []);

    // Join strategies and variants in memory
    const strategies = React.useMemo(() => {
        return strategiesData.map(strategy => ({
            ...strategy,
            variants: variantsData.filter(variant => variant.strategyId === strategy.id)
        }));
    }, [strategiesData, variantsData]);

    // Add a new strategy
    const addStrategy = async (strategy: Omit<StrategyItem, 'id' | 'variants'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, 'strategies'), strategy);
            return docRef.id;
        } catch (err: any) {
            console.error('Error adding strategy:', err);
            setError(err.message);
            throw err;
        }
    };

    // Add a new variant
    const addVariant = async (variant: Omit<Variant, 'id'>, strategyId: string): Promise<string> => {
        try {
            const variantWithStrategyId = {
                ...variant,
                strategyId,
                headerId: strategyId // Keep headerId for backward compatibility
            };
            const docRef = await addDoc(collection(db, 'variants'), variantWithStrategyId);
            return docRef.id;
        } catch (err: any) {
            console.error('Error adding variant:', err);
            setError(err.message);
            throw err;
        }
    };

    // Update a variant
    const updateVariant = async (variantId: string, updates: Partial<Variant>): Promise<void> => {
        try {
            const variantRef = doc(db, 'variants', variantId);
            await updateDoc(variantRef, updates);
        } catch (err: any) {
            console.error('Error updating variant:', err);
            setError(err.message);
            throw err;
        }
    };

    // Delete a strategy and all its variants
    const deleteStrategy = async (id: string): Promise<void> => {
        try {
            // First, delete all variants associated with this strategy
            const variantsQuery = query(collection(db, 'variants'), where('strategyId', '==', id));
            const variantsSnapshot = await getDocs(variantsQuery);

            const deletePromises = variantsSnapshot.docs.map(variantDoc =>
                deleteDoc(doc(db, 'variants', variantDoc.id))
            );
            await Promise.all(deletePromises);

            // Then delete the strategy itself
            await deleteDoc(doc(db, 'strategies', id));
        } catch (err: any) {
            console.error('Error deleting strategy:', err);
            setError(err.message);
            throw err;
        }
    };

    // Delete a variant
    const deleteVariant = async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, 'variants', id));
        } catch (err: any) {
            console.error('Error deleting variant:', err);
            setError(err.message);
            throw err;
        }
    };

    const value: StrategyContextType = {
        strategies,
        loading,
        error,
        addStrategy,
        addVariant,
        updateVariant,
        deleteStrategy,
        deleteVariant
    };

    return (
        <StrategyContext.Provider value={value}>
            {children}
        </StrategyContext.Provider>
    );
};
