import { GlobalBranchAssignment } from "./global-branch-assignment.js";

/** How screens and exports show a global branch assignment. */
export class GlobalBranchAssignmentView {
  code: string;
  name: string;
  audienceId: string;
  unitText: string;
  priorityText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    unitText: string,
    priorityText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.unitText = unitText;
    this.priorityText = priorityText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBranchAssignmentView(item: GlobalBranchAssignment): GlobalBranchAssignmentView {
  return new GlobalBranchAssignmentView(
    item.code,
    item.name,
    item.audienceId,
    item.unit,
    String(item.priority),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBranchAssignmentViews(items: GlobalBranchAssignment[]): GlobalBranchAssignmentView[] {
  const views: GlobalBranchAssignmentView[] = [];
  for (const item of items) {
    views.push(toGlobalBranchAssignmentView(item));
  }
  return views;
}

export function sumGlobalBranchAssignmentView(view: GlobalBranchAssignmentView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedPriority + parsedImpressions;
}
