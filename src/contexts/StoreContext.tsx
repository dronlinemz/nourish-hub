import React, { createContext, useContext, useState } from "react";
import type { Product, Supplier, Order } from "@/types/store";
import { MOCK_SUPPLIERS, MOCK_PRODUCTS } from "@/data/mockData";

interface StoreContextType {
  products: Product[];
  suppliers: Supplier[];
  orders: Order[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  getSupplier: (id: string) => Supplier | undefined;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [orders, setOrders] = useState<Order[]>([]);

  const getSupplier = (id: string) => suppliers.find((s) => s.id === id);

  const addOrder = (order: Order) => setOrders((prev) => [order, ...prev]);

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  return (
    <StoreContext.Provider
      value={{ products, suppliers, orders, setProducts, setSuppliers, setOrders, getSupplier, addOrder, updateOrderStatus }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
