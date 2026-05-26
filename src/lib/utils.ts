type ClassValue = string | number | boolean | null | undefined | ClassValue[];

function flattenClasses(value: ClassValue): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenClasses);
  }

  return [String(value)];
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.flatMap(flattenClasses).join(" ");
}
