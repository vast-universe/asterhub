import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  error?: boolean;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        "h-11 px-3 rounded-lg border bg-white dark:bg-gray-900",
        "text-base text-gray-900 dark:text-white",
        "placeholder:text-gray-400",
        error ? "border-red-500" : "border-gray-300 dark:border-gray-700",
        className
      )}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
}
