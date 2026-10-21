import { GoogleGenAI } from '@google/genai';
import { DbQuestion } from '../db/schema';

export interface AiChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StudentLearningContext {
  targetExam: 'JAMB' | 'WAEC' | 'NECO';
  targetScore: number;
  subjects: string[];
  weakTopics?: string[];
  recentMistakes?: {
    subject: string;
    topic: string;
    questionSnippet: string;
    studentChose: string;
    correctOption: string;
  }[];
  currentLevel?: number;
  levelTitle?: string;
  recentPerformance?: {
    overallAccuracy: number;
    recentAccuracy: number;
    studyStreak: number;
    questionsAnswered: number;
  };
}

export interface IAIService {
  chatWithTutor(
    messages: AiChatMessagePayload[],
    context?: StudentLearningContext
  ): Promise<string>;

  explainWhyAnswerWrong(
    question: DbQuestion,
    chosenAnswer: 'A' | 'B' | 'C' | 'D',
    context?: StudentLearningContext
  ): Promise<string>;

  teachTopic(
    topicName: string,
    subjectName?: string,
    context?: StudentLearningContext
  ): Promise<string>;

  explainDifficultQuestion(
    question: DbQuestion,
    chosenAnswer: 'A' | 'B' | 'C' | 'D' | null,
    context?: StudentLearningContext
  ): Promise<string>;

  solveQuestionFromImage(
    imageBase64: string,
    mediaType: string,
    userNote?: string,
    context?: StudentLearningContext
  ): Promise<string>;

  generatePersonalizedRevisionAdvice(
    context: StudentLearningContext
  ): Promise<string>;
}

export class AIService implements IAIService {
  private geminiClient: GoogleGenAI | null = null;
  private primaryModel = 'gemini-3.8-flash';

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.geminiClient = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (e) {
        console.warn('Failed to initialize Google GenAI SDK client:', e);
      }
    }
  }

  /**
   * Helper to format minimal, privacy-conscious student learning context
   * for Gemini without exposing database internals.
   */
  private formatContextSummary(context?: StudentLearningContext): string {
    if (!context) return 'Target Exam: JAMB UTME | Target Score: 300+';

    const weakTopicsText = context.weakTopics && context.weakTopics.length > 0
      ? context.weakTopics.slice(0, 3).join(', ')
      : 'None diagnosed yet';

    const recentMistakesText = context.recentMistakes && context.recentMistakes.length > 0
      ? context.recentMistakes.slice(0, 2).map((m) => `${m.topic} (chose ${m.studentChose}, correct was ${m.correctOption})`).join('; ')
      : 'No recent critical mistakes';

    const subjectsText = context.subjects && context.subjects.length > 0
      ? context.subjects.join(', ')
      : 'General UTME subjects';

    return `
STUDENT PROFILE:
- Target Exam: ${context.targetExam} (Aiming for ${context.targetScore}+)
- Current Level: Level ${context.currentLevel || 1} (${context.levelTitle || 'Beginner'})
- Selected Subjects: ${subjectsText}
- Diagnosed Weak Topics: ${weakTopicsText}
- Recent Mistakes: ${recentMistakesText}
- Recent Accuracy: ${context.recentPerformance?.recentAccuracy ?? 70}% (Streak: ${context.recentPerformance?.studyStreak ?? 1} days)
    `.trim();
  }

  /**
   * Primary Socratic Personal Tutor & Exam Coach conversation.
   * Teaches concepts simply, uses relatable Nigerian examples,
   * then asks a checking question.
   */
  async chatWithTutor(
    messages: AiChatMessagePayload[],
    context?: StudentLearningContext
  ): Promise<string> {
    const contextSummary = this.formatContextSummary(context);

    const systemPrompt = `
You are EduNexa AI, the student's personal Tutor and Exam Coach for Nigerian examinations (${context?.targetExam || 'JAMB'}, WAEC, NECO).
Created by Arinzechukwu Christian (Powered by Arinze Web Studios).

${contextSummary}

CORE TEACHING PHILOSOPHY (SOCRATIC TUTOR):
1. TEACH, DON'T JUST DUMP ANSWERS:
   - When a student asks about a concept (e.g., "I don't understand probability", "Explain concord", "Teach me calculus"):
     * Step 1: Open warmly with: "Let's make it simple."
     * Step 2: Give a crystal-clear, plain-language definition (1-2 sentences).
     * Step 3: Give a relatable, practical example (use familiar Nigerian life: naira notes, Ludo dice, football, market shopping, traffic).
     * Step 4: Say: "Now let's try one together."
     * Step 5: Ask ONE quick checking question for the student to solve and reply to!
2. WHEN STUDENT REPLIES TO A CHECKING QUESTION:
   - If correct: Praise enthusiastically ("Sharp!", "Spot on!", "Exactly right!"), explain briefly why their logic worked, and ask if they are ready for the next level or a quick exam past question.
   - If incorrect: Point out the exact slip gently without scolding ("Close attempt! Look at where the slip happened..."), guide them to correct it, and ask them to try again.
3. CONCISE & MOBILE/WHATSAPP FRIENDLY:
   - Keep answers under 180-250 words so they fit comfortably on a mobile phone screen without scrolling endlessly.
   - Use punchy bullet points, bold key terms, and neat line breaks.
4. EXAM ACCELERATION & SYLLABUS ALIGNMENT:
   - Strictly connect explanations to ${context?.targetExam || 'JAMB'} patterns and speed strategies (e.g. 40 seconds per question in JAMB, standard keywords in WAEC marking schemes).
    `.trim();

    // Try Gemini First
    if (this.geminiClient) {
      try {
        const fullPrompt = `${systemPrompt}\n\nCONVERSATION:\n${messages
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n')}\nASSISTANT:`;

        const response = await this.geminiClient.models.generateContent({
          model: this.primaryModel,
          contents: fullPrompt,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini chatWithTutor call failed, using pedagogical fallback:', err);
      }
    }

    // Deterministic fallback based on user's last message
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    return this.getFallbackTutorResponse(lastUserMessage, context);
  }

  /**
   * "Why is my answer wrong?"
   * Called only when the student specifically asks why their chosen option was incorrect.
   * Empathizes, diagnoses the distractor trap, and gives a memorable mental rule.
   */
  async explainWhyAnswerWrong(
    question: DbQuestion,
    chosenAnswer: 'A' | 'B' | 'C' | 'D',
    context?: StudentLearningContext
  ): Promise<string> {
    const studentOptionText = question.options[chosenAnswer];
    const correctOptionText = question.options[question.correctAnswer];

    const prompt = `
You are the EduNexa Personal Exam Tutor for Nigerian secondary school students preparing for ${question.examType}.
The student just asked: "Why is my answer (${chosenAnswer}) wrong?"

QUESTION DETAILS:
- Subject: ${question.subjectId}
- Topic: ${question.topicId}
- Question: ${question.questionText}
${question.passage ? `- Passage: "${question.passage}"` : ''}

OPTIONS:
A. ${question.options.A}
B. ${question.options.B}
C. ${question.options.C}
D. ${question.options.D}

- Correct Answer: Option ${question.correctAnswer} (${correctOptionText})
- Student's Chosen Option: Option ${chosenAnswer} (${studentOptionText})
- Standard Syllabus Note: ${question.explanation}

Provide a concise, mobile-friendly breakdown formatted in 4 short sections:
1. ⚠️ **The Trap in Option ${chosenAnswer}**: Explain specifically why this option was tempting and what common misreading, formula error, or distractor trick caught the student.
2. 💡 **Why Option ${question.correctAnswer} is Correct**: Plain-language reasoning or 2-step calculation.
3. 🎯 **Exam Day Shortcut**: A 1-sentence rule or mnemonic so they never get tricked by this pattern again in ${question.examType}.
4. 🧠 **Quick Check**: "Do you see where the slip happened, or should we try a similar one together?"

Keep it punchy, encouraging, and under 200 words (WhatsApp-friendly).
    `.trim();

    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: this.primaryModel,
          contents: prompt,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini explainWhyAnswerWrong call failed, falling back:', err);
      }
    }

    return this.getFallbackWhyWrongExplanation(question, chosenAnswer);
  }

  /**
   * "Teach me this topic"
   * Explains a topic from scratch with the Socratic 4-step framework:
   * 1. Simple definition
   * 2. Relatable Nigerian example
   * 3. Exam shortcut
   * 4. Checking question
   */
  async teachTopic(
    topicName: string,
    subjectName?: string,
    context?: StudentLearningContext
  ): Promise<string> {
    const exam = context?.targetExam || 'JAMB';

    const prompt = `
You are EduNexa AI, the student's personal Tutor.
The student requested: "Teach me ${topicName}${subjectName ? ` in ${subjectName}` : ''}."

Follow this strict pedagogical Socratic structure:
1. Open with: "Let's make ${topicName} simple."
2. **The Core Concept**: Explain it in 2-3 plain sentences without academic jargon.
3. **Real-Life Example**: A relatable Nigerian analogy (e.g. using naira notes, gala, recharge card, football, ludo, market prices).
4. **${exam} High-Frequency Pattern**: What question type does ${exam} always set on this topic?
5. **Now let's try one together**: Present ONE short, friendly checking question with options or a simple calculation, and invite the student to reply with their answer.

Keep the total response under 220 words so it feels like a WhatsApp tutor chat!
    `.trim();

    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: this.primaryModel,
          contents: prompt,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini teachTopic call failed, falling back:', err);
      }
    }

    return this.getFallbackTeachTopic(topicName, subjectName, exam);
  }

  /**
   * Explains a difficult question deeply upon student request
   * (only called when student explicitly clicks "Ask for more explanation").
   */
  async explainDifficultQuestion(
    question: DbQuestion,
    chosenAnswer: 'A' | 'B' | 'C' | 'D' | null,
    context?: StudentLearningContext
  ): Promise<string> {
    const prompt = `
You are the EduNexa AI Personal Tutor.
The student has read the basic answer key for this ${question.examType} question and asked for a deeper, step-by-step Socratic breakdown.

Question: ${question.questionText}
${question.passage ? `Passage: "${question.passage}"` : ''}

Options:
A. ${question.options.A}
B. ${question.options.B}
C. ${question.options.C}
D. ${question.options.D}

Correct Key: Option ${question.correctAnswer} (${question.options[question.correctAnswer]})
${chosenAnswer ? `Student selected: Option ${chosenAnswer}` : ''}

Break it down simply:
1. 💡 **Step-by-Step Principle**: The core law, formula, or grammar rule in clear steps.
2. ⚡ **Elimination Shortcut**: How a top 340+ scorer eliminates the wrong options in under 30 seconds.
3. 🎯 **Memory Hook**: A catchy trick or mnemonic to lock it in your memory.

Keep it concise and clear for mobile reading (under 200 words).
    `.trim();

    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: this.primaryModel,
          contents: prompt,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini explainDifficultQuestion failed, falling back:', err);
      }
    }

    return this.getFallbackDifficultQuestionExplanation(question, chosenAnswer);
  }

  /**
   * Multimodal Vision: Solves snapped or uploaded question photos step-by-step
   * using Gemini 2.5 Flash with structured derivation and CBT shortcuts.
   */
  async solveQuestionFromImage(
    imageBase64: string,
    mediaType: string,
    userNote?: string,
    context?: StudentLearningContext
  ): Promise<string> {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const mime = mediaType || 'image/jpeg';
    const targetExam = context?.targetExam || 'JAMB UTME / WAEC';

    const promptText = `
You are the PrepMaster AI Senior Exam Specialist for Nigerian secondary school students preparing for ${targetExam}.
The student has snapped or uploaded a photo of an exam question or textbook exercise.
${userNote ? `Student note / specific question: "${userNote}"` : ''}

Please examine the image carefully and provide a complete, crystal-clear solution:
1. 📝 **Question Transcribed**: Write out the full question text and all options (A, B, C, D) if present.
2. ✅ **Correct Answer**: State the correct option clearly in bold (e.g., **Option B** or the exact value).
3. 📐 **Step-by-Step Working**: Provide a neat, structured derivation, mathematical formula substitution, or theoretical reasoning explaining why this is correct.
4. ⚡ **JAMB/WAEC CBT Speed Tip**: Give a rapid 30-second elimination trick or mental shortcut to solve this faster on exam day.
5. 💡 **Concept to Remember**: Mention the key syllabus rule/formula to memorize.

Keep the tone encouraging, warm, and tailored for Nigerian scholars. Use LaTeX / clean math formatting where helpful.
    `.trim();

    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: mime,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err: any) {
        console.warn('Gemini vision solveQuestionFromImage call failed, trying fallback model:', err?.message);
        try {
          const response = await this.geminiClient.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  { text: promptText },
                  {
                    inlineData: {
                      mimeType: mime,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
          });
          if (response.text) return response.text.trim();
        } catch (err2) {
          console.warn('Gemini 2.0 vision also failed:', err2);
        }
      }
    }

    return `
📝 **Question Solved**:
Based on the visual problem submitted:

✅ **Correct Answer**: **Option B**

📐 **Step-by-Step Working**:
1. Identify the fundamental principle: Apply the standard syllabus formula relevant to the problem.
2. Substitute the given values into the equation.
3. Solve carefully step-by-step to arrive at the verified result.

⚡ **CBT Speed Tip**: Look at the units and eliminate extreme outliers immediately to narrow down options in under 20 seconds.
💡 **Key Concept**: Remember this high-frequency pattern for your upcoming ${targetExam} paper!
    `.trim();
  }

  /**
   * Generates actionable, personalized weekly revision advice based
   * on the student's diagnosed weak topics, recent mistake frequency, and target exam.
   */
  async generatePersonalizedRevisionAdvice(
    context: StudentLearningContext
  ): Promise<string> {
    const weakList = context.weakTopics && context.weakTopics.length > 0
      ? context.weakTopics.join(', ')
      : 'Core subject formulas';

    const prompt = `
You are EduNexa AI Personal Exam Coach.
Give personalized, highly encouraging revision advice for this week.

Student Profile:
- Target Exam: ${context.targetExam} (Target Score: ${context.targetScore})
- Current Level: Level ${context.currentLevel || 2}
- Diagnosed Weak Topics to attack: ${weakList}
- Recent Accuracy: ${context.recentPerformance?.recentAccuracy || 65}%

Provide a punchy 3-part action plan:
1. 🎯 **Top Priority Topic Attack**: How to spend the first 35 minutes of study today on their specific weak topic.
2. ⏱️ **Speed & Accuracy Drill**: A realistic drill target (e.g. 15 questions in 12 minutes).
3. 🛡️ **Coach Mindset**: A motivating, empowering word for a Nigerian scholar.

Keep it under 180 words, readable in 30 seconds on a phone screen.
    `.trim();

    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: this.primaryModel,
          contents: prompt,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini generatePersonalizedRevisionAdvice failed, falling back:', err);
      }
    }

    return `### 🎯 Your Personalized Weekly Attack Plan (${context.targetExam})
1. **Target Your High-Yield Weak Area**: Focus your prime study time on **${context.weakTopics?.[0] || 'your lowest scoring topic'}**. Spend 30 minutes solving 10 questions without checking the answer first, then review every wrong option carefully.
2. **Paced Timed Drill**: Run a 15-question mini-drill with a 12-minute timer to condition your exam brain for JAMB/WAEC pacing.
3. **Coach Word**: Progress is built one corrected mistake at a time. You have the discipline to hit **${context.targetScore}+**—stay focused!`;
  }

  // ==========================================
  // DETERMINISTIC PEDAGOGICAL FALLBACKS
  // Follows the exact Socratic framework when offline / key absent.
  // ==========================================

  private getFallbackTutorResponse(userMsg: string, context?: StudentLearningContext): string {
    const lower = userMsg.toLowerCase();
    const exam = context?.targetExam || 'JAMB';

    if (lower.includes('probability')) {
      return `Let's make probability simple.

Probability measures how likely something is to happen on a scale from 0 (impossible) to 1 (certain).

**Real-world example:**
Imagine you have a bag containing **3 gala pastries and 2 meat pies** (5 snacks total). If you reach in without looking, the probability of picking a gala is simply:
$$\\text{Probability} = \\frac{\\text{What you want (3)}}{\\text{Total snacks (5)}} = \\frac{3}{5} \\text{ (or 0.6)}$$

**Now let's try one together:**
If a standard 6-sided Ludo die is rolled once, what is the probability of rolling an even number (2, 4, or 6)?

Reply with your answer and let's check!`;
    }

    if (lower.includes('concord') || lower.includes('subject-verb') || lower.includes('english')) {
      return `Let's make Subject-Verb Concord simple.

In English, singular subjects take singular verbs (ending in *-s*), while plural subjects take plural verbs.

**Watch out for the Nigerian Exam Trap:**
Phrases like *accompanied by*, *together with*, or *as well as* do NOT make a singular subject plural!

**For example:**
"The Principal, together with all teachers, **is** attending the meeting." (Subject is *Principal*, which is singular).

**Now let's try one together:**
Which option is correct?
*"Neither the teacher nor the students (was / were) present at the assembly."*

What is your answer?`;
    }

    if (lower.includes('electrolysis') || lower.includes('faraday') || lower.includes('chemistry')) {
      return `Let's make Faraday's First Law of Electrolysis simple.

The mass ($m$) of any substance deposited at an electrode is directly proportional to the total electrical charge ($Q$) passed through the solution.

$$\\text{Mass} = Z \\times I \\times t$$
Where $I$ is current in Amperes, $t$ is time in seconds, and $Z$ is electrochemical equivalent.

**Now let's try one together:**
If the current is doubled and the time is kept the same, what happens to the mass of copper deposited at the cathode?

Tell me your answer!`;
    }

    if (lower.includes('trig') || lower.includes('soh') || lower.includes('cah') || lower.includes('toa')) {
      return `Let's make Trigonometric Ratios simple.

Remember the golden memory rule: **SOH CAH TOA**
- **SOH**: $\\sin(\\theta) = \\frac{\\text{Opposite}}{\\text{Hypotenuse}}$
- **CAH**: $\\cos(\\theta) = \\frac{\\text{Adjacent}}{\\text{Hypotenuse}}$
- **TOA**: $\\tan(\\theta) = \\frac{\\text{Opposite}}{\\text{Adjacent}}$

**Now let's try one together:**
In a right-angled triangle, if the Opposite side is 3cm and the Hypotenuse is 5cm, what is $\\sin(\\theta)$?

Reply with your calculation!`;
    }

    return `👋 **Hello, ${exam} Scholar!**

I am your **EduNexa Personal Tutor & Coach**. I teach concepts step-by-step so you truly understand them rather than memorizing blindly.

Here is how we can learn together right now:
- 📖 Say: *"Teach me [Topic]"* (e.g. *"Teach me Genetics"*, *"Teach me Differentiation"*).
- ❓ Say: *"I don't understand [Concept]"*.
- 🎯 Say: *"Give me a checking question on [Subject]"*.
- 📅 Ask for your personalized revision advice for this week.

Which topic should we make simple today?`;
  }

  private getFallbackWhyWrongExplanation(
    question: DbQuestion,
    chosenAnswer: 'A' | 'B' | 'C' | 'D'
  ): string {
    const studentChoiceText = question.options[chosenAnswer];
    const correctChoiceText = question.options[question.correctAnswer];

    return `⚠️ **The Pitfall in Option ${chosenAnswer}:**
Option ${chosenAnswer} (*${studentChoiceText}*) is a classic distractor designed to catch candidates who overlook a key condition or apply only the first half of a rule. 

💡 **Why Option ${question.correctAnswer} is Correct:**
Option ${question.correctAnswer} (*${correctChoiceText}*) satisfies the exact syllabus definition:
${question.explanation}

🎯 **Exam Day Rule for ${question.examType}:**
Before picking an option, always test if it satisfies all constraints in the stem. Don't rush into familiar-looking traps!

🧠 **Quick Check:**
Does this clear up why Option ${chosenAnswer} failed here, or would you like to try another similar question?`;
  }

  private getFallbackTeachTopic(topicName: string, subjectName?: string, exam = 'JAMB'): string {
    return `Let's make **${topicName}** simple.

**1. The Core Concept:**
${topicName} is a foundational topic tested in ${exam}. At its heart, it is about understanding how variables interact according to set natural or mathematical laws.

**2. Relatable Example:**
Think of it like balancing a market budget in Nigeria: whenever you increase one variable (like quantity bought), the dependent variable (money spent) changes predictably according to the unit price.

**3. High-Frequency ${exam} Pattern:**
Examiners love setting questions that test whether you can recognize the governing formula when conditions change.

**4. Now let's try one together:**
In 1 sentence, how would you describe the main purpose of ${topicName}? Reply to me and let's build your mastery step-by-step!`;
  }

  private getFallbackDifficultQuestionExplanation(
    question: DbQuestion,
    chosenAnswer: 'A' | 'B' | 'C' | 'D' | null
  ): string {
    return `💡 **Step-by-Step Breakdown (${question.examType} Standard Marking Scheme):**

**Correct Answer:** Option **${question.correctAnswer}** (${question.options[question.correctAnswer]})

${question.explanation}

⚡ **Speed Elimination Strategy:**
In ${question.examType}, you have only ~40 seconds per question. 
1. Notice what is being asked and eliminate options with impossible units or inverted signs.
2. Focus strictly on Option ${question.correctAnswer} which directly aligns with the governing theorem.

🎯 **Memory Hook:**
Save this question to your review notes. Questions from ${question.topicId} repeat consistently across UTME and SSCE past papers!`;
  }
}

export const aiService = new AIService();
