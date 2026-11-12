import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';

type FieldProps = {
  label: string;
  required?: boolean;
  /** Pesan salah di bawah isian. Kosong berarti isian valid. */
  error?: string;
  /** Keterangan kecil di bawah isian kalau nggak ada error. */
  hint?: string;
  children: ReactNode;
};

/** Pembungkus satu isian form: label, isian, lalu error atau keterangan. */
export function FormField({ label, required, error, hint, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

type TextFieldProps = TextInputProps & {
  /** Satuan di ujung kanan, misalnya "kg". */
  suffix?: string;
  invalid?: boolean;
};

/** Kotak isian teks dengan gaya TERNAK. */
export function TextField({ suffix, invalid, style, ...props }: TextFieldProps) {
  return (
    <View style={[styles.inputBox, invalid && styles.inputInvalid]}>
      <TextInput
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, style]}
        {...props}
      />
      {suffix ? (
        <View style={styles.suffix}>
          <Text style={styles.suffixText}>{suffix}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  required: {
    color: Colors.danger,
  },
  error: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.medium,
    color: Colors.danger,
  },
  hint: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  inputInvalid: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  suffix: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceMuted,
  },
  suffixText: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
  },
});
