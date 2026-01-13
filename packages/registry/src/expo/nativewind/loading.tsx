import { View, ActivityIndicator, Text } from "react-native";
import { cn } from "@/lib/utils";

export interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  className?: string;
}

export function Loading({
  size = "large",
  color = "#3b82f6",
  text,
  className,
}: LoadingProps) {
  return (
    <View className={cn("items-center justify-center gap-2", className)}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-500 dark:text-gray-400 text-sm">{text}</Text>
      )}
    </View>
  );
}
