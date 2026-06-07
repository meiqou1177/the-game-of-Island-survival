import { useState } from 'react';
import { ArrowLeft, BookOpen, Check } from 'lucide-react';
import type { SubjectGrade, Subject, Grade } from '@/types/game';
import { SUBJECTS } from '@/data/questions';

interface SubjectGradeSelectProps {
  onSelect: (sg: SubjectGrade) => void;
  onBack: () => void;
}

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];

const SUBJECT_DETAILS: Record<Subject, { desc: string; color: string; borderColor: string; bgClass: string; hoverBg: string }> = {
  chinese: { desc: '字词成语、古诗词、文学常识', color: '#E74C3C', borderColor: '#C0392B', bgClass: 'bg-red-900/30', hoverBg: 'hover:bg-red-800/40' },
  math: { desc: '四则运算、几何、分数小数', color: '#3498DB', borderColor: '#2980B9', bgClass: 'bg-blue-900/30', hoverBg: 'hover:bg-blue-800/40' },
  english: { desc: '单词短语、语法句型', color: '#2ECC71', borderColor: '#27AE60', bgClass: 'bg-green-900/30', hoverBg: 'hover:bg-green-800/40' },
  science: { desc: '自然科学、物理化学常识', color: '#9B59B6', borderColor: '#8E44AD', bgClass: 'bg-purple-900/30', hoverBg: 'hover:bg-purple-800/40' },
};

export function SubjectGradeSelect({ onSelect, onBack }: SubjectGradeSelectProps) {
  const [step, setStep] = useState<'subject' | 'grade'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [hoveredGrade, setHoveredGrade] = useState<number | null>(null);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setStep('grade');
  };

  const handleGradeSelect = (grade: Grade) => {
    if (!selectedSubject) return;
    setSelectedGrade(grade);
    setTimeout(() => {
      onSelect({ subject: selectedSubject, grade });
    }, 300);
  };

  const handleBack = () => {
    if (step === 'grade') {
      setStep('subject');
      setSelectedSubject(null);
    } else {
      onBack();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      {/* 背景 */}
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/assets/title_bg.jpg)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* 返回按钮 */}
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          style={{ fontFamily: 'monospace' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{step === 'grade' ? '重选学科' : '返回'}</span>
        </button>

        {/* 步骤指示器 */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
            step === 'subject' ? 'border-orange-500 bg-orange-900/30 text-orange-400' : 'border-green-500 bg-green-900/30 text-green-400'
          }`}>
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-bold" style={{ fontFamily: 'monospace' }}>
              1. 选择学科
            </span>
            {selectedSubject && <Check className="w-3 h-3 ml-1" />}
          </div>
          <div className="w-8 h-0.5 bg-gray-700" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
            step === 'grade' ? 'border-orange-500 bg-orange-900/30 text-orange-400' : 'border-gray-700 bg-gray-800/30 text-gray-600'
          }`}>
            <span className="text-xs font-bold" style={{ fontFamily: 'monospace' }}>
              2. 选择年级
            </span>
            {selectedGrade && <Check className="w-3 h-3 ml-1" />}
          </div>
        </div>

        {/* ===== 步骤1：选择学科 ===== */}
        {step === 'subject' && (
          <>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center" style={{ fontFamily: '"Press Start 2P", monospace', color: '#ECF0F1', textShadow: '2px 2px 0 #2C3E50, 4px 4px 0 #000' }}>
              选择学科
            </h2>
            <p className="text-gray-400 mb-8 text-center" style={{ fontFamily: 'monospace' }}>
              选择你要挑战的学科领域
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
              {SUBJECTS.map((subject) => {
                const detail = SUBJECT_DETAILS[subject.id];
                const isHovered = hoveredSubject === subject.id;
                return (
                  <button
                    key={subject.id}
                    onMouseEnter={() => setHoveredSubject(subject.id)}
                    onMouseLeave={() => setHoveredSubject(null)}
                    onClick={() => handleSubjectSelect(subject.id)}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${detail.bgClass} ${detail.hoverBg} ${isHovered ? 'scale-105 shadow-xl' : ''}`}
                    style={{
                      borderColor: isHovered ? detail.color : detail.borderColor + '60',
                      boxShadow: isHovered ? `0 0 30px ${detail.color}30` : 'none',
                    }}
                  >
                    <div className="text-4xl mb-3">{subject.icon}</div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: detail.color, fontFamily: 'monospace' }}>
                      {subject.name}
                    </h3>
                    <p className="text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
                      {detail.desc}
                    </p>
                    {isHovered && (
                      <div className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: detail.color, color: '#000', fontFamily: 'monospace' }}>
                        选择
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ===== 步骤2：选择年级 ===== */}
        {step === 'grade' && selectedSubject && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{SUBJECTS.find(s => s.id === selectedSubject)?.icon}</span>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: '"Press Start 2P", monospace', color: SUBJECT_DETAILS[selectedSubject].color, textShadow: '2px 2px 0 #2C3E50, 4px 4px 0 #000' }}>
                {SUBJECTS.find(s => s.id === selectedSubject)?.name}
              </h2>
            </div>
            <p className="text-gray-400 mb-8 text-center" style={{ fontFamily: 'monospace' }}>
              选择你的年级（题目和时长基于人教版教材）
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
              {GRADES.map((grade) => {
                const detail = SUBJECT_DETAILS[selectedSubject];
                const isHovered = hoveredGrade === grade;
                const timeMap = { 1: '12秒', 2: '11秒', 3: '10秒', 4: '9秒', 5: '8秒', 6: '7秒' };
                const diffMap = { 1: '入门', 2: '基础', 3: '进阶', 4: '熟练', 5: '挑战', 6: '精英' };

                return (
                  <button
                    key={grade}
                    onMouseEnter={() => setHoveredGrade(grade)}
                    onMouseLeave={() => setHoveredGrade(null)}
                    onClick={() => handleGradeSelect(grade)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-center ${detail.bgClass} ${detail.hoverBg} ${isHovered ? 'scale-105 shadow-xl' : ''}`}
                    style={{
                      borderColor: isHovered ? detail.color : detail.borderColor + '60',
                      boxShadow: isHovered ? `0 0 20px ${detail.color}30` : 'none',
                    }}
                  >
                    <div className="text-2xl font-bold mb-1" style={{ color: detail.color, fontFamily: 'monospace' }}>
                      {grade}
                    </div>
                    <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'monospace' }}>
                      年级
                    </div>
                    <div className="text-[10px] px-2 py-0.5 rounded-full inline-block mb-1" style={{ backgroundColor: detail.color + '20', color: detail.color, fontFamily: 'monospace' }}>
                      {diffMap[grade]}
                    </div>
                    <div className="text-[9px] text-gray-500" style={{ fontFamily: 'monospace' }}>
                      限时 {timeMap[grade]}
                    </div>
                    {isHovered && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: detail.color }}>
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 说明 */}
            <div className="mt-6 px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700 max-w-md">
              <p className="text-[10px] text-gray-500 text-center" style={{ fontFamily: 'monospace' }}>
                低年级：时间充裕，题目简单，敌人较弱
                <br />
                高年级：时间紧凑，题目较难，敌人较强
                <br />
                题目内容基于人教版课程标准
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
