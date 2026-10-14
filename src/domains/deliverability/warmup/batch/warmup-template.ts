import * as text from "../../../../kit/text.js";

/** Where a warmup template is in its life cycle. */
export type WarmupTemplateStatus = "created" | "validated" | "published" | "retired";

/** A warmup template. Its code is unique within a tenant. */
export class WarmupTemplate {
  code: string;
  name: string;
  cost: number;
  frequencyCap: number;
  weight: number;
  status: WarmupTemplateStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    frequencyCap: number,
    weight: number,
    status: WarmupTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WarmupTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.cost - this.weight) * 100) / 100;
  }

  copy(): WarmupTemplate {
    return new WarmupTemplate(this.code, this.name, this.cost, this.frequencyCap, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a warmup template in status created. */
export function newWarmupTemplate(code: string, name: string): WarmupTemplate {
  return new WarmupTemplate(code, name, 0, 0, 0, "created");
}
