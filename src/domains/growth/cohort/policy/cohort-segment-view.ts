import { CohortSegment } from "./cohort-segment.js";

/** How screens and exports show a cohort segment. */
export class CohortSegmentView {
  code: string;
  title: string;
  segmentText: string;
  category: string;
  sequence: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segmentText: string,
    category: string,
    sequence: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segmentText = segmentText;
    this.category = category;
    this.sequence = sequence;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toCohortSegmentView(item: CohortSegment): CohortSegmentView {
  return new CohortSegmentView(
    item.code,
    item.title,
    item.segment,
    item.category,
    String(item.sequence),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortSegmentViews(items: CohortSegment[]): CohortSegmentView[] {
  const views: CohortSegmentView[] = [];
  for (const item of items) {
    views.push(toCohortSegmentView(item));
  }
  return views;
}

export function sumCohortSegmentView(view: CohortSegmentView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
