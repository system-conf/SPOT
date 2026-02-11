// ─── Template Helpers ───────────────────────────────────────────

import { TemplateVariable, TemplateAction } from "@/db/schema";

/**
 * Parse template variables from template string
 * Example: "Hello {{name}}, your balance is {{balance}}"
 */
export function parseTemplateVariables(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
        variables.push(match[1]);
    }

    return variables;
}

/**
 * Render template with provided variables
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        rendered = rendered.replace(regex, String(value));
    }

    return rendered;
}

/**
 * Validate template variables against required variables
 */
export function validateTemplateVariables(
    providedVariables: Record<string, any>,
    requiredVariables: TemplateVariable[]
): { valid: boolean; missing: string[]; invalid: string[] } {
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const variable of requiredVariables) {
        if (variable.required && !(variable.name in providedVariables)) {
            missing.push(variable.name);
        }

        if (variable.name in providedVariables) {
            const value = providedVariables[variable.name];
            const typeValid = validateVariableType(value, variable.type);
            if (!typeValid) {
                invalid.push(`${variable.name} (expected ${variable.type})`);
            }
        }
    }

    return {
        valid: missing.length === 0 && invalid.length === 0,
        missing,
        invalid,
    };
}

/**
 * Validate variable type
 */
function validateVariableType(value: any, type: TemplateVariable["type"]): boolean {
    switch (type) {
        case "text":
            return typeof value === "string";
        case "number":
            return typeof value === "number" || !isNaN(Number(value));
        case "url":
            return typeof value === "string" && (value as string).startsWith("http");
        default:
            return true;
    }
}

/**
 * Generate slug from template name
 */
export function generateTemplateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
