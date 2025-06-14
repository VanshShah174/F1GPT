import PromptSuggestionButton from "./PromptSuggestionButton";

interface Props {
    onPromptClick: (promptText: string) => void;
}

const PromptSuggestionsRow = ({ onPromptClick }: Props) => {
    const prompts = [
        "Who is the highest paid F1 driver?",
        "Who won the inaugural F1 Academy Driver's Championship?",
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
