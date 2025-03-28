import React from "react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { VariantProps } from "class-variance-authority";

interface DevnetBadgeProps extends Omit<React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>, "variant"> {
  children?: React.ReactNode;
  className?: string;
  showOnMobile?: boolean;
}

const DevnetBadge: React.FC<DevnetBadgeProps> = ({
  children = "Devnet",
  className = "",
  showOnMobile = false,
  ...props
}) => {
  return (
    <Badge
      variant="secondary"
      className={`bg-purple-100 text-purple-700 text-[10px] uppercase font-semibold ${
        showOnMobile ? "" : "hidden sm:inline-flex"
      } ${className}`}
      {...props}
    >
      {children}
    </Badge>
  );
};

export default DevnetBadge;
