import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useExamStore = defineStore('exam', () => {
  const currentExam = ref(null)
  const questions = ref([])
  const currentIndex = ref(0)
  const answers = ref({}) // exam_question_id -> selected_option
  const result = ref(null)
  const paymentId = ref(null)

  const startExam = async (pmtId, lang) => {
    const { data } = await api.post('/exams/create', { payment_id: pmtId, language: lang })
    currentExam.value = { id: data.examId }
    paymentId.value = pmtId
    answers.value = {}
    currentIndex.value = 0
    result.value = null
    return data.examId
  }

  const loadQuestions = async (examId, lang) => {
    const { data } = await api.get(`/exams/${examId}/questions`, { params: { lang } })
    currentExam.value = data.exam
    questions.value = data.questions
    // Restore saved answers
    data.questions.forEach((q) => {
      if (q.selected_option) answers.value[q.exam_question_id] = q.selected_option
    })
    return data.questions
  }

  const submitAnswer = async (examId, examQuestionId, option, timeSpent = 0) => {
    answers.value[examQuestionId] = option
    const { data } = await api.post(`/exams/${examId}/answer`, {
      exam_question_id: examQuestionId,
      selected_option: option,
      time_spent_seconds: timeSpent,
    })
    return data.is_correct
  }

  const finishExam = async (examId) => {
    const { data } = await api.post(`/exams/${examId}/finish`)
    result.value = data.result
    return data.result
  }

  const reset = () => {
    currentExam.value = null
    questions.value = []
    currentIndex.value = 0
    answers.value = {}
    result.value = null
    paymentId.value = null
  }

  return { currentExam, questions, currentIndex, answers, result, paymentId, startExam, loadQuestions, submitAnswer, finishExam, reset }
})
