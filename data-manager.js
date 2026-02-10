/**
 * Data Management Module for Perfect Wood Application
 * Handles saving and loading data from the data folder
 */

const DataManager = {
    // Base path for data files
    dataPath: './data/',

    // Default data structure
    defaultData: {
        products: [],
        customers: [],
        sellers: [],
        customerTransactions: [],
        supplierTransactions: []
    },

    /**
     * Initialize data files if they don't exist
     */
    async initialize() {
        try {
            // Check if running in a browser environment
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment - files will be handled by main process
                console.log('Running in Electron environment');
                return;
            }

            // Browser environment - use localStorage with data folder simulation
            console.log('Running in browser environment');
            this.migrateFromLocalStorage();
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    },

    /**
     * Migrate existing localStorage data to new structure
     */
    migrateFromLocalStorage() {
        const existingData = localStorage.getItem('perfectWoodData');
        const existingCustomerTransactions = localStorage.getItem('customerTransactions');
        const existingSupplierTransactions = localStorage.getItem('supplierTransactions');

        if (existingData) {
            // Save to new structure
            localStorage.setItem('data/perfectWoodData.json', existingData);
        }

        if (existingCustomerTransactions) {
            localStorage.setItem('data/customerTransactions.json', existingCustomerTransactions);
        }

        if (existingSupplierTransactions) {
            localStorage.setItem('data/supplierTransactions.json', existingSupplierTransactions);
        }
    },

    /**
     * Load main data (products, customers, sellers)
     */
    async loadData() {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment
                const result = await window.electronAPI.loadData();
                return result.data || this.defaultData;
            }

            // Browser environment - load from localStorage with data folder prefix
            const data = localStorage.getItem('data/perfectWoodData.json');
            if (data) {
                return JSON.parse(data);
            }

            // Return default data if nothing exists
            return { ...this.defaultData };
        } catch (error) {
            console.error('Error loading data:', error);
            return { ...this.defaultData };
        }
    },

    /**
     * Save main data (products, customers, sellers)
     */
    async saveData(data) {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment
                await window.electronAPI.saveData(data);
                return true;
            }

            // Browser environment - save to localStorage with data folder prefix
            localStorage.setItem('data/perfectWoodData.json', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    },

    /**
     * Load customer transactions
     */
    async loadCustomerTransactions() {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment
                const result = await window.electronAPI.loadData();
                return result.customerTransactions || [];
            }

            // Browser environment
            const transactions = localStorage.getItem('data/customerTransactions.json');
            return transactions ? JSON.parse(transactions) : [];
        } catch (error) {
            console.error('Error loading customer transactions:', error);
            return [];
        }
    },

    /**
     * Save customer transactions
     */
    async saveCustomerTransactions(transactions) {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment
                await window.electronAPI.saveTransactions('customer', transactions);
                return true;
            }

            // Browser environment
            localStorage.setItem('data/customerTransactions.json', JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.error('Error saving customer transactions:', error);
            return false;
        }
    },

    /**
     * Load supplier transactions
     */
    async loadSupplierTransactions() {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment
                const result = await window.electronAPI.loadData();
                return result.supplierTransactions || [];
            }

            // Browser environment
            const transactions = localStorage.getItem('data/supplierTransactions.json');
            return transactions ? JSON.parse(transactions) : [];
        } catch (error) {
            console.error('Error loading supplier transactions:', error);
            return [];
        }
    },

    /**
     * Save supplier transactions
     */
    async saveSupplierTransactions(transactions) {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment
                await window.electronAPI.saveTransactions('supplier', transactions);
                return true;
            }

            // Browser environment
            localStorage.setItem('data/supplierTransactions.json', JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.error('Error saving supplier transactions:', error);
            return false;
        }
    },

    /**
     * Export all data to JSON file (for backup)
     */
    async exportData() {
        try {
            const data = await this.loadData();
            const customerTransactions = await this.loadCustomerTransactions();
            const supplierTransactions = await this.loadSupplierTransactions();

            const exportData = {
                ...data,
                customerTransactions,
                supplierTransactions,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `perfect-wood-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    },

    /**
     * Import data from JSON file
     */
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);

                    // Validate data structure
                    if (!importData.products || !importData.customers || !importData.sellers) {
                        throw new Error('Invalid data structure');
                    }

                    // Save imported data
                    await this.saveData({
                        products: importData.products || [],
                        customers: importData.customers || [],
                        sellers: importData.sellers || []
                    });

                    if (importData.customerTransactions) {
                        await this.saveCustomerTransactions(importData.customerTransactions);
                    }

                    if (importData.supplierTransactions) {
                        await this.saveSupplierTransactions(importData.supplierTransactions);
                    }

                    resolve(true);
                } catch (error) {
                    console.error('Error importing data:', error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    },

    /**
     * Clear all data (reset to default)
     */
    async clearAllData() {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron environment
                await window.electronAPI.clearAllData();
                return true;
            }

            // Browser environment
            localStorage.removeItem('data/perfectWoodData.json');
            localStorage.removeItem('data/customerTransactions.json');
            localStorage.removeItem('data/supplierTransactions.json');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
};

// Auto-initialize when script loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        DataManager.initialize();
    });
}
