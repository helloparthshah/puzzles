import { Container } from "react-bootstrap"
import {
    makeStyles,
    Body1,
    Caption1,
    Button,
    shorthands,
    Card,
    CardFooter,
    CardHeader,
    CardPreview,
    Text,
    Input,
    Label,
    Toaster,
    useToastController,
    Toast,
    useId,
    Link,
    ToastTitle,
    ToastBody,
    ToastFooter,
} from "@fluentui/react-components";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Puzzle({ puzzle, onSubmit }) {
    const toasterId = useId("toaster");
    const { dispatchToast } = useToastController(toasterId);
    const [answer, setAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingProgress, setIsSavingProgress] = useState(false);

    useEffect(() => {
        if (!puzzle) {
            window.location.href = "/";
        }
    }, [puzzle]);

    function renderQuestion() {
        switch (puzzle.type) {
            case "image":
                return (
                    <>
                        <Container style={{ height: "300px", position: "relative" }}>
                            <Image
                                src={puzzle.question ?? ""}
                                alt={puzzle.name ?? ""}
                                style={{ objectFit: "contain" }}
                                fill={true}
                            />
                        </Container>
                        <Button as="a"
                            className="mt-2"
                            appearance="outline"
                            download
                            href={puzzle.question ?? ""}
                        >
                            Download
                        </Button>
                    </>
                );
            default:
                return (
                    <Text>
                        {puzzle.question ?? ""}
                    </Text>
                );
        }
    }

    return (
        <>
            <Toaster toasterId={toasterId} />
            <Container className="d-flex flex-column align-items-center justify-content-around" style={{ height: "100vh" }}>
                <Card
                    appearance="outline"
                    style={{
                        minWidth: "50vw",
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}>
                    <CardHeader
                        header={
                            <Body1>
                                <b>{puzzle.name ?? ""}</b>
                                {puzzle.solved && (
                                    <span style={{ 
                                        marginLeft: '10px', 
                                        color: '#28a745', 
                                        fontSize: '1.2em' 
                                    }}>
                                        ✓ Solved
                                    </span>
                                )}
                            </Body1>
                        }
                        description={<Caption1>Hint: {puzzle.hint ?? ""}</Caption1>}
                    />
                    <Container className="m-2 mt-0">
                        <p>
                            <Text>
                                {puzzle.description ?? ""}
                            </Text>
                        </p>
                        <CardPreview>
                            <p>
                                {renderQuestion()}
                            </p>
                        </CardPreview>
                    </Container>
                </Card>
                <Card
                    appearance="outline"
                    style={{
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}>
                    <Container className="m-2 d-flex flex-column align-items-center justify-content-around">
                        <Label htmlFor="answer">
                            Answer
                        </Label>
                        <Input 
                            id="answer" 
                            placeholder={puzzle.solved ? "Puzzle already solved" : "Type your answer here"} 
                            value={answer} 
                            disabled={puzzle.solved}
                            onChange={(e) => {
                                setAnswer(e.target.value)
                            }} 
                        />
                        <Button 
                            className="mt-2" 
                            appearance="outline" 
                            disabled={isSubmitting || isSavingProgress || puzzle.solved}
                            onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                    let isCorrect = await onSubmit(answer);
                                    if (isCorrect) {
                                        setAnswer("");
                                        setIsSavingProgress(true);
                                        
                                        // Show success toast with progress saving indicator
                                        dispatchToast(
                                            <Toast>
                                                <ToastTitle>
                                                    Correct Answer!
                                                </ToastTitle>
                                                <ToastBody>Saving progress and unlocking next puzzle...</ToastBody>
                                            </Toast>,
                                            { intent: "success" }
                                        );
                                        
                                        // Give a brief moment for progress saving to complete
                                        setTimeout(() => {
                                            setIsSavingProgress(false);
                                            dispatchToast(
                                                <Toast>
                                                    <ToastTitle>
                                                        Progress Saved!
                                                    </ToastTitle>
                                                    <ToastBody>Continue onto the next question</ToastBody>
                                                </Toast>,
                                                { intent: "success" }
                                            );
                                        }, 800);
                                    } else {
                                        dispatchToast(
                                            <Toast>
                                                <ToastTitle>
                                                    Incorrect Answer!
                                                </ToastTitle>
                                                <ToastBody>Hint: {puzzle.hint}</ToastBody>
                                            </Toast>,
                                            { intent: "error" }
                                        );
                                    }
                                } catch (error) {
                                    console.error('Error submitting answer:', error);
                                    setIsSavingProgress(false);
                                    
                                    dispatchToast(
                                        <Toast>
                                            <ToastTitle>
                                                Submission Error
                                            </ToastTitle>
                                            <ToastBody>There was an error submitting your answer. Please try again.</ToastBody>
                                        </Toast>,
                                        { intent: "error" }
                                    );
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}>
                            {puzzle.solved ? "Solved" : isSubmitting ? "Checking..." : isSavingProgress ? "Saving Progress..." : "Submit"}
                        </Button>
                    </Container>
                </Card >
            </Container >
        </>
    )
}