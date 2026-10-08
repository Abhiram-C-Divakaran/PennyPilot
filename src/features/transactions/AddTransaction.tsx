import React from "react";
import { TransactionForm } from "./TransactionForm";
import { TransactionCategory } from "../../types/category";
import { CreateTransactionInput, UpdateTransactionInput } from "../../types/transaction";

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TransactionCategory[];
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
}

export const AddTransaction: React.FC<AddTransactionProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit
}) => {
  return (
    <TransactionForm
      isOpen={isOpen}
      onClose={onClose}
      initialData={null}
      categories={categories}
      onSubmit={onSubmit}
    />
  );
};
