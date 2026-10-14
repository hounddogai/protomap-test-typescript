import * as text from "../../../../kit/text.js";

/** Where a activation template is in its life cycle. */
export type ActivationTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A activation template. Its code is unique within a tenant. */
export class ActivationTemplate {
  code: string;
  name: string;
  attributes: Map<string, string>;
  notes: string;
  openRate: number;
  archived: boolean;
  status: ActivationTemplateStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    notes: string,
    openRate: number,
    archived: boolean,
    status: ActivationTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.notes = notes;
    this.openRate = openRate;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"activation template"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): ActivationTemplate {
    return new ActivationTemplate(
      this.code,
      this.name,
      this.attributes,
      this.notes,
      this.openRate,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation template in status new. */
export function newActivationTemplate(code: string, name: string): ActivationTemplate {
  return new ActivationTemplate(code, name, new Map<string, string>(), "", 0, false, "new");
}
