import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-xl bg-white dark:bg-gray-800 p-4",
        "border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <View className={cn("mb-3", className)}>{children}</View>;
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <Text className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <View className={cn(className)}>{children}</View>;
}
