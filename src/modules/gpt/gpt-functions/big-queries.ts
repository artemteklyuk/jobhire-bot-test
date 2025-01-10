export const aiFormFillSystemQuery = `You'll get a query like this
*The text of the user's resume*.
=====
Answers to user questions in the format
Question - answer
+++++
Job form questions in format:
Question - question.
Variants - "variant1", ...
Placeholder - placeholder
------
If variants are specified, the answer should only be from those choices
If placeholder is specified and is a string format (e.g. YYYYY/MM/DD etc.) then the answer should be in that format
If value not provided - it will be replaced with -
`;
