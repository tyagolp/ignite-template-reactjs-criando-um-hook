import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProduct = await api.get(`/products/${productId}`)
      const responseStock = await api.get(`/stock/${productId}`)

      const stock = responseStock.data as UpdateProductAmount
      const product = responseProduct.data as Product

      const item = cart.find(x => x.id === productId);

      if (item) {
        if (stock.amount === item.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        item.amount += 1
        const args = [...cart.filter(x => x.id !== productId), item]
        setCart(args)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(args))
      }
      else {
        product.amount = 1;
        if (stock.amount < product.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const args = [...cart, product]
        setCart(args)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(args))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const product = cart.find(x => x.id === productId)

      if (!product) {

        toast.error('Erro na remoção do produto');
        return;
      }


      const args = cart.filter(x => x.id !== productId)
      setCart(args)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(args))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0)
        return;

      const responseStock = await api.get(`/stock/${productId}`)

      const stock = responseStock.data as UpdateProductAmount

      const product = cart.find(x => x.id === productId);

      if (!product) {
        return;
      }

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      }
      else {
        const args = cart.map(x => {
          if (x.id === productId)
            x.amount = amount
          return x
        });
        setCart(args)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(args))

      }
    } catch (e) {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
