import PromptSuggestionButton from "./PromptSuggestionButton";

interface Props {
    onPromptClick: (promptText: string) => void;
}

const PromptSuggestionsRow = ({ onPromptClick }: Props) => {
    const prompts = [
        "Who is head of racing for Aston Martin's F1 Academy team?",
        "Who is the highest paid F1 driver?",
        "Who will be the newest driver for Ferrari?",
        "Who is the current Formula One World Driver's Champion?",
    ];

    return (
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, idx) => (
                <PromptSuggestionButton
                    key={idx}
                    text={prompt}
                    onClick={() => onPromptClick(prompt)}
                />
            ))}
        </div>
    );
};

export default PromptSuggestionsRow;
