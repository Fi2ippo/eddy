import FeedStory from "../components/FeedStory";
import VerticalFeed from "../components/VerticalFeed";
import { demoStories } from "../data/demo-stories";

export default function FeedPage() {
  return (
    <VerticalFeed total={demoStories.length}>
      {demoStories.map((story, index) => (
        <FeedStory
          key={story.id}
          story={story}
          last={index === demoStories.length - 1}
        />
      ))}
    </VerticalFeed>
  );
}
