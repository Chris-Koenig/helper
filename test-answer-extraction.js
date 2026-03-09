/**
 * Test Script - Answer Extraction for All Question Types
 * Tests the _extractAnswerByType function for all 6 question types
 */

// Mock QAManager with test data
class TestQAManager {
    _extractAnswerByType(question) {
        if (!question.question_type) return null;

        switch (question.question_type) {
            case 'single_choice':
            case 'multi_select':
                return question.answer?.correct_option_ids?.join(', ') || null;

            case 'yes_no_matrix':
                if (question.statements && Array.isArray(question.statements)) {
                    return question.statements.map(s => s.answer).join('; ');
                }
                return null;

            case 'hotspot':
                if (question.fields && Array.isArray(question.fields)) {
                    return question.fields.map(f => f.answer).join('; ');
                }
                return null;

            case 'drag_drop':
                if (question.answer && typeof question.answer === 'object') {
                    return Object.entries(question.answer)
                        .map(([key, value]) => `${key}→${value}`)
                        .join('; ');
                }
                return null;

            case 'drag_drop_order':
                if (question.answer_sequence && Array.isArray(question.answer_sequence)) {
                    return question.answer_sequence.join(' → ');
                }
                return null;

            default:
                return null;
        }
    }
}

// Test data
const tests = [
    {
        name: 'Q9 - single_choice',
        question: {
            question_id: 9,
            question_type: 'single_choice',
            question_text: 'Test question',
            answer: { correct_option_ids: ['B'] }
        },
        expected: 'B'
    },
    {
        name: 'Q17 - multi_select',
        question: {
            question_id: 17,
            question_type: 'multi_select',
            question_text: 'Test question',
            answer: { correct_option_ids: ['A', 'D'] }
        },
        expected: 'A, D'
    },
    {
        name: 'Q14 - yes_no_matrix',
        question: {
            question_id: 14,
            question_type: 'yes_no_matrix',
            question_text: 'Test question',
            statements: [
                { statement: 'Statement 1', answer: 'No' },
                { statement: 'Statement 2', answer: 'No' },
                { statement: 'Statement 3', answer: 'Yes' }
            ]
        },
        expected: 'No; No; Yes'
    },
    {
        name: 'Q2 - hotspot',
        question: {
            question_id: 2,
            question_type: 'hotspot',
            question_text: 'Test question',
            fields: [
                { name: 'Field 1', answer: 'SELECT YEAR' },
                { name: 'Field 2', answer: 'ROLLUP(...)' }
            ]
        },
        expected: 'SELECT YEAR; ROLLUP(...)'
    },
    {
        name: 'Q5 - drag_drop',
        question: {
            question_id: 5,
            question_type: 'drag_drop',
            question_text: 'Test question',
            answer: {
                'Entity1': 'Master data',
                'Entity2': 'Certified',
                'Entity3': 'Promoted',
                'Entity4': 'Cannot be endorsed'
            }
        },
        expected: 'Entity1→Master data; Entity2→Certified; Entity3→Promoted; Entity4→Cannot be endorsed'
    },
    {
        name: 'Q7 - drag_drop_order',
        question: {
            question_id: 7,
            question_type: 'drag_drop_order',
            question_text: 'Test question',
            answer_sequence: [
                'Create an environment.',
                'Install the libraries.',
                'Set the default environment.'
            ]
        },
        expected: 'Create an environment. → Install the libraries. → Set the default environment.'
    }
];

// Run tests
console.log('🧪 Testing Answer Extraction for All Question Types\n');
const manager = new TestQAManager();
let passed = 0;
let failed = 0;

tests.forEach(test => {
    const result = manager._extractAnswerByType(test.question);
    const success = result === test.expected;
    
    if (success) {
        console.log(`✅ ${test.name}`);
        console.log(`   Result: ${result}\n`);
        passed++;
    } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Expected: ${test.expected}`);
        console.log(`   Got:      ${result}\n`);
        failed++;
    }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
