import React from "react";
import { TransactionForm } from "./TransactionForm";
import { TransactionCategory } from "../../types/category";
import { FinanceTransaction, CreateTransactionInput, UpdateTransactionInput } from "../../types/transaction";

interface EditTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinanceTransaction | null;
  categories: TransactionCategory[];
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const EditTransaction: React.FC<EditTransactionProps> = ({
  isOpen,
  onClose,
  transaction,
  categories,
  onSubmit,
  onDelete
}) => {
  return (
    <TransactionForm
      isOpen={isOpen}
      onClose={onClose}
      initialData={transaction}
      categories={categories}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
};
