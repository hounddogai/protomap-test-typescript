import * as text from "../../../../kit/text.js";

/** Where a primary activation template is in its life cycle. */
export type PrimaryActivationTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary activation template as the activation team keeps it. */
export class PrimaryActivationTemplate {
  code: string;
  label: string;
  currency: string;
  locale: string;
  title: string;
  amount: number;
  ceiling: number;
  floorValue: number;
  visible: boolean;
  score: number;
  channel: string;
  status: PrimaryActivationTemplateStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    locale: string,
    title: string,
    amount: number,
    ceiling: number,
    floorValue: number,
    visible: boolean,
    score: number,
    channel: string,
    status: PrimaryActivationTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.locale = locale;
    this.title = title;
    this.amount = amount;
    this.ceiling = ceiling;
    this.floorValue = floorValue;
    this.visible = visible;
    this.score = score;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryActivationTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryActivationTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary activation template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.ceiling - this.amount) * 100) / 100;
  }

  copy(): PrimaryActivationTemplate {
    return new PrimaryActivationTemplate(
      this.code,
      this.label,
      this.currency,
      this.locale,
      this.title,
      this.amount,
      this.ceiling,
      this.floorValue,
      this.visible,
      this.score,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary activation template in status idle. */
export function newPrimaryActivationTemplate(code: string, label: string): PrimaryActivationTemplate {
  return new PrimaryActivationTemplate(code, label, "", "", "", 0, 0, 0, false, 0, "", "idle");
}
