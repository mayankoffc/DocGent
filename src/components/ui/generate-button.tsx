import React from "react";
import styles from "./generate-button.module.css";

interface GenerateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  loading?: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  children = "Generate",
  loading = false,
  disabled,
  ...props
}) => {
  return (
    <span className={styles["button-wrap"]}>
      <span className={styles["button-shadow"]} />
      <button
        className={styles.button}
        disabled={disabled || loading}
        {...props}
      >
        <span className={styles.span}>
          {loading ? "Generating..." : children}
        </span>
      </button>
    </span>
  );
};

export default GenerateButton;
