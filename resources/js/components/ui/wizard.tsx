import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

export interface WizardStep {
    id: string;
    label: string;
    isValid: boolean;
    hasErrors?: boolean;
    content: React.ReactNode;
}

interface WizardProps {
    steps: WizardStep[];
    activeStep: string;
    onStepChange: (stepId: string) => void;
    submitButtonText?: string;
    onSubmit?: () => void;
    isSubmitting?: boolean;
}

export default function Wizard({
    steps,
    activeStep,
    onStepChange,
    submitButtonText = 'Submit',
    onSubmit,
    isSubmitting = false,
}: WizardProps) {
    const { t } = useTranslation();
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    const currentStep = steps[currentIndex];

    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === steps.length - 1;

    const handleNext = () => {
        if (currentStep?.isValid && !isLastStep) {
            onStepChange(steps[currentIndex + 1].id);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            onStepChange(steps[currentIndex - 1].id);
        }
    };

    return (
        <div className="w-full">
            {/* Stepper Header */}
            <div className="mb-6 border-b pb-4 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {steps.map((step, index) => {
                        const isCompleted = currentIndex > index;
                        const isActive = activeStep === step.id;

                        // A step is clickable if all preceding steps are valid
                        const isClickable = index === 0 || steps.slice(0, index).every(s => s.isValid);

                        return (
                            <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                                <button
                                    type="button"
                                    disabled={!isClickable}
                                    onClick={() => {
                                        if (isClickable) onStepChange(step.id);
                                    }}
                                    className={`flex items-center gap-2 focus:outline-none transition-all duration-200 text-left rtl:text-right ${step.hasErrors
                                        ? 'text-red-600 dark:text-red-400'
                                        : isActive
                                            ? 'text-primary'
                                            : isCompleted
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-400 dark:text-gray-500'
                                        } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                >
                                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200 ${step.hasErrors
                                        ? 'border-red-600 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                                        : isActive
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : isCompleted
                                                ? 'border-green-600 bg-green-600 text-white'
                                                : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-400'
                                        }`}>
                                        {step.hasErrors ? (
                                            <AlertCircle className="h-4 w-4" />
                                        ) : isCompleted ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className="flex-1 mx-4 h-0.5 bg-gray-200 dark:bg-gray-800 hidden md:block min-w-[30px]" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Tabs value={activeStep} onValueChange={onStepChange} className="w-full">
                {steps.map((step) => (
                    <TabsContent key={step.id} value={step.id} className="mt-4">
                        {step.content}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Button Bar at the bottom */}
            <div className="flex flex-wrap justify-between gap-3 pt-4 border-t mt-6">
                <div>
                    {!isFirstStep && (
                        <Button type="button" variant="outline" onClick={handlePrev}>
                            {t('Previous')}
                        </Button>
                    )}
                </div>
                <div>
                    {isLastStep ? (
                        <Button
                            onClick={onSubmit}
                            disabled={isSubmitting || !currentStep?.isValid}
                        >
                            {isSubmitting ? t('Creating...') : submitButtonText}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={!currentStep?.isValid}
                        >
                            {t('Next')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
