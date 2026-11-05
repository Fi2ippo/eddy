import { Suspense } from "react";
import FeedView from "../components/FeedView";

export default function FeedPage() {
  return (
    <Suspense>
      <FeedView />
    </Suspense>
  );
}
