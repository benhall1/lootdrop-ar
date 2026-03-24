import { Text, type TextProps, Platform } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography, Fonts } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) return darkColor;
    if (!isDark && lightColor) return lightColor;
    if (type === "link") return theme.link;
    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "body":
        return Typography.body;
      case "small":
        return Typography.small;
      case "link":
        return Typography.link;
      default:
        return Typography.body;
    }
  };

  // Headers get display font, body text gets sans font
  const fontFamily =
    type === "h1" || type === "h2" || type === "h3"
      ? Fonts?.display
      : Fonts?.sans;

  return (
    <Text
      style={[
        { color: getColor(), fontFamily },
        getTypeStyle(),
        style,
      ]}
      {...rest}
    />
  );
}
