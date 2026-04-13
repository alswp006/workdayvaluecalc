import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  Button,
  Paragraph,
  Spacing,
  TextField,
  Toast,
  Top,
} from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import { recognizePrice } from '@/lib/domain/scanApi';
import type { RouteState } from '@/lib/types';

type ToastMessage = string | null;

const TOAST_MESSAGES = {
  NO_FILE: '사진을 선택해주세요',
  WRONG_TYPE: '이미지 파일만 선택할 수 있어요',
  NO_AMOUNT: '인식된 금액이 없어요. 직접 입력해 주세요',
  BAD_IMAGE: '지원하지 않는 이미지예요. 다른 사진을 선택해 주세요',
  FAIL: '가격 인식에 실패했어요. 직접 입력해 주세요',
  AUTH: '로그인이 필요해요. 다시 시도해 주세요',
} as const;

export default function Scan() {
  const navigate = useNavigate();
  const { isBootLoading, profile, aiNoticeState, ackScanAiNotice, addScanAiCalc } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef(false); // 중복 요청 방지 (sync guard)

  const [isScanning, setIsScanning] = useState(false);
  const [amount, setAmount] = useState('');
  const [hasAiResult, setHasAiResult] = useState(false);
  const [showAiNoticeDialog, setShowAiNoticeDialog] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);

  const showToast = (msg: string) => {
    setToast(msg);
  };

  if (isBootLoading) {
    return <Paragraph.Text typography="st6">불러오는 중...</Paragraph.Text>;
  }

  // ── 스캔 트리거 ──────────────────────────────────────────────
  const handleScanTrigger = () => {
    if (isScanningRef.current) return;

    if (!aiNoticeState.scanAiNoticeAcknowledged) {
      setShowAiNoticeDialog(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAiNoticeConfirm = () => {
    ackScanAiNotice();
    setShowAiNoticeDialog(false);
    fileInputRef.current?.click();
  };

  // ── 파일 선택 처리 ────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      showToast(TOAST_MESSAGES.NO_FILE);
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showToast(TOAST_MESSAGES.WRONG_TYPE);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (isScanningRef.current) return; // 중복 요청 차단
    isScanningRef.current = true;
    setIsScanning(true);
    setHasAiResult(false);
    setAmount('');

    try {
      const result = await recognizePrice(file);

      if (result.status === 200) {
        setAmount(String(result.normalizedAmountKRW));
        setHasAiResult(true);
      } else if (result.status === 422) {
        showToast(TOAST_MESSAGES.NO_AMOUNT);
      } else if (result.status === 400) {
        showToast(TOAST_MESSAGES.BAD_IMAGE);
      } else if (result.status === 401) {
        showToast(TOAST_MESSAGES.AUTH);
      } else {
        showToast(TOAST_MESSAGES.FAIL);
      }
    } catch {
      showToast(TOAST_MESSAGES.FAIL);
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── 계산 실행 ─────────────────────────────────────────────────
  const handleCalc = () => {
    if (!profile) return;
    const parsed = Number(amount);
    if (!amount || parsed < 1) return;

    generateHapticFeedback({ type: 'success' });

    const calcId = `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    addScanAiCalc({ title: `스캔 인식 금액`, amountKRW: parsed });

    const state: RouteState['/result'] = { calcId };
    navigate('/result', { state });
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>사진으로 인식</Top.TitleParagraph>} />

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Spacing size={32} />

        {/* 안내 영역 */}
        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          <Paragraph.Text typography="t3">🔍</Paragraph.Text>
          <Spacing size={8} />
          <Paragraph.Text typography="t4">상품 가격표를 찍어보세요</Paragraph.Text>
          <Spacing size={4} />
          <Paragraph.Text typography="st6">
            AI가 가격을 인식해서 노동값을 바로 계산해드려요
          </Paragraph.Text>
        </div>

        <Spacing size={32} />

        <div style={{ display: 'grid' }}>
          <Button
            variant="fill"
            size="large"
            disabled={isScanning}
            onClick={handleScanTrigger}
          >
            {isScanning ? '인식 중...' : '사진으로 인식하기'}
          </Button>
        </div>

        {isScanning && (
          <>
            <Spacing size={16} />
            <div style={{ textAlign: 'center' }}>
              <Paragraph.Text typography="st6">인식 중...</Paragraph.Text>
            </div>
          </>
        )}

        {hasAiResult && (
          <>
            <Spacing size={24} />
            <Paragraph.Text typography="st13">AI가 생성한 결과입니다</Paragraph.Text>
            <Spacing size={8} />
            <TextField
              variant="box"
              label="인식된 금액(원)"
              value={amount}
              inputMode="numeric"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            />
            <Spacing size={16} />
            <div style={{ display: 'grid' }}>
              <Button
                variant="fill"
                size="large"
                disabled={Number(amount) < 1}
                onClick={handleCalc}
              >
                이 금액으로 계산
              </Button>
            </div>
          </>
        )}

        <Spacing size={16} />
        <div style={{ display: 'grid' }}>
          <Button variant="weak" size="large" onClick={() => navigate(-1 as any)}>
            뒤로
          </Button>
        </div>
      </div>

      {/* AI 고지 다이얼로그 */}
      <AlertDialog
        open={showAiNoticeDialog}
        title="AI 서비스 안내"
        description="이 서비스는 생성형 AI를 활용합니다"
        alertButton={
          <AlertDialog.AlertButton onClick={handleAiNoticeConfirm}>
            확인
          </AlertDialog.AlertButton>
        }
        onClose={() => setShowAiNoticeDialog(false)}
      />

      <Toast
        open={toast !== null}
        position="bottom"
        onClose={() => setToast(null)}
        text={toast ?? ''}
      />
    </>
  );
}
