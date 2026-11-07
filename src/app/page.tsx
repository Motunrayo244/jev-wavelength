import { HomeLobby } from "@/components/HomeLobby";
import { WaveField } from "@/components/WaveField";

export default function Home() {
  return (
    <main className="home">
      <WaveField />
      <div className="home-shell">
        <p className="brand">Wavelength</p>
        <h1 className="home-headline">Guess how sure the model is.</h1>
        <p className="home-lede">
          A dilemma hits the airwaves. OpenAI picks yes or no. Closest confidence
          guess on the dial wins the round.
        </p>
        <HomeLobby />
      </div>
    </main>
  );
}
