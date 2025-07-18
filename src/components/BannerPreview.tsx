// BannerPreview.tsx 수정
import React, { useEffect, RefObject, useCallback, useRef, useState } from 'react';
import { BannerConfig, TextElement } from '../types';
import { drawTextWithLetterSpacing } from '../utils/canvasUtils';

interface BannerPreviewProps {
  config: BannerConfig;
  uploadedImage: File | null;
  uploadedLogo?: File | null;
  uploadedLogos?: File[]; // 다중 로고
  textElements: TextElement[];
  existingImageUrl?: string | null;
  existingLogoUrl?: string | null;
  existingLogoUrls?: string[]; // 다중 로고 URLs
  logoHeight?: number;
  onDrawStart?: () => void;
  onDrawComplete?: () => void;
}

export const BannerPreview = React.forwardRef<HTMLCanvasElement, BannerPreviewProps>(({
  config,
  uploadedImage,
  uploadedLogo,
  uploadedLogos = [],
  textElements,
  existingImageUrl,
  existingLogoUrl,
  existingLogoUrls = [],
  logoHeight,
  onDrawStart,
  onDrawComplete
}, ref) => {
  // 더블 버퍼링을 위한 오프스크린 캔버스
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // 드래그 상태
  const [dragging, setDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [startHeight, setStartHeight] = useState<number>(logoHeight || 56);
  // 이미지 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  // 핸들 위치 계산 (단일/다중 로고 모두 지원)
  let handleX = 0, handleY = 0, handleW = 16, handleH = 16;
  let logoX = config.logo?.x ?? config.multiLogo?.x ?? 0;
  let logoY = config.logo?.y ?? config.multiLogo?.y ?? 0;
  let logoW = 0;
  let aspect = 1;
  if (uploadedLogo && config.logo) {
    // 단일 로고
    aspect = 1;
    if (uploadedLogo instanceof File) {
      const img = new window.Image();
      img.src = URL.createObjectURL(uploadedLogo);
      img.onload = () => {
        aspect = img.width / img.height;
      };
    }
    logoW = (logoHeight ?? 56) * aspect;
    handleX = logoX + logoW - handleW / 2;
    handleY = logoY + (logoHeight ?? 56) - handleH / 2;
  } else if (uploadedLogos.length > 0 && config.multiLogo) {
    // 다중 로고: 첫 번째 로고 기준
    aspect = 1;
    const firstLogo = uploadedLogos[0];
    if (firstLogo instanceof File) {
      const img = new window.Image();
      img.src = URL.createObjectURL(firstLogo);
      img.onload = () => {
        aspect = img.width / img.height;
      };
    }
    logoW = (logoHeight ?? config.multiLogo.maxHeight) * aspect;
    handleX = logoX + logoW - handleW / 2;
    handleY = logoY + (logoHeight ?? config.multiLogo.maxHeight) - handleH / 2;
  }

  // 더블 버퍼링용 오프스크린 캔버스 초기화
  useEffect(() => {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = config.width;
    offscreenCanvas.height = config.height;
    offscreenCanvasRef.current = offscreenCanvas;
  }, [config.width, config.height]);

  // 드래그 이벤트 핸들러
  const onHandleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStartY(e.clientY);
    setStartHeight(logoHeight || 56);
    e.stopPropagation();
    e.preventDefault();
  };
  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (dragStartY !== null) {
        let delta = e.clientY - dragStartY;
        let newHeight = Math.max(24, Math.min(200, startHeight + delta));
        setStartHeight(newHeight);
      }
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, dragStartY, startHeight]);

  // 텍스트 렌더링 함수
  const drawTextElements = useCallback((ctx: CanvasRenderingContext2D, elements: TextElement[]) => {
    elements.forEach(element => {
      ctx.save();
      
      // 버튼 텍스트인 경우 배경 그리기 (텍스트가 없어도 표시)
      if (element.id === 'button-text') {
        // 버튼 배경 그리기 (끝만 둥근 사각형)
        const buttonX = element.x;
        const buttonY = element.y;
        const buttonWidth = element.width;
        const buttonHeight = element.height;
        const borderRadius = 20;  // 적당한 둥근 모서리
        
        // 사용자 설정 배경색 또는 기본값
        const backgroundColor = element.backgroundColor || '#4F46E5';
        ctx.fillStyle = backgroundColor;
        
        // 둥근 모서리 사각형 그리기
        ctx.beginPath();
        ctx.moveTo(buttonX + borderRadius, buttonY);
        ctx.lineTo(buttonX + buttonWidth - borderRadius, buttonY);
        ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + borderRadius);
        ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - borderRadius);
        ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - borderRadius, buttonY + buttonHeight);
        ctx.lineTo(buttonX + borderRadius, buttonY + buttonHeight);
        ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - borderRadius);
        ctx.lineTo(buttonX, buttonY + borderRadius);
        ctx.quadraticCurveTo(buttonX, buttonY, buttonX + borderRadius, buttonY);
        ctx.closePath();
        ctx.fill();
        
        // 버튼 그림자 효과
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // 폰트 두께 설정 (기본값 400)
      const fontWeight = element.fontWeight || 400;
      ctx.font = `${fontWeight} ${element.fontSize}px Pretendard`;
      ctx.textBaseline = 'top'; // 텍스트의 기준선을 상단으로 설정
      
      // 텍스트 정렬 설정
      const isInteractiveBanner = config.name.includes('인터랙티브');
      
      if (element.id === 'button-text') {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
        // 인터랙티브 배너의 텍스트들만 중앙 정렬
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      } else {
        // 나머지는 모두 왼쪽 정렬 (기본 배너, 전면 배너 등)
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
      }
      
      // 줄바꿈 처리
      const lines = element.text.split('\n');
      const lineHeight = element.fontSize * 1.2; // 줄 간격 설정
      
      lines.forEach((line, lineIndex) => {
        let y, currentX;
        
        if (element.id === 'button-text') {
          // 버튼 텍스트는 가운데 정렬
          y = element.y + element.height / 2 + (lineIndex * lineHeight);
          currentX = element.x + element.width / 2;
        } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
          // 인터랙티브 배너의 텍스트들만 중앙 정렬
          y = element.y + (lineIndex * lineHeight);
          currentX = element.x + element.width / 2;
        } else {
          // 나머지는 모두 왼쪽 정렬 (기본 배너, 전면 배너 등)
          y = element.y + (lineIndex * lineHeight);
          currentX = element.x;
        }
        
        // 버튼 텍스트는 간단하게 처리 (부분 색상 없음)
        if (element.id === 'button-text') {
          ctx.fillStyle = element.color;
          const displayText = line || 'Button'; // 텍스트가 없으면 기본값 표시
          if (element.letterSpacing) {
            drawTextWithLetterSpacing(ctx, displayText, currentX, y, element.letterSpacing);
          } else {
            ctx.fillText(displayText, currentX, y);
          }
        }
        // 부분 색상이 있는 경우
        else if (element.colorSegments && element.colorSegments.length > 0) {
          // 현재 줄의 시작 인덱스 계산
          const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
          
          // 인터랙티브 배너의 중앙 정렬인 경우 전체 텍스트 너비를 계산해서 시작 위치 조정
          if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
            const totalWidth = element.letterSpacing 
              ? line.split('').reduce((sum, char, idx) => 
                  sum + ctx.measureText(char).width + (idx < line.length - 1 ? (element.letterSpacing || 0) : 0), 0)
              : ctx.measureText(line).width;
            currentX = currentX - totalWidth / 2;
          }
          
          let lastIndex = 0;
          
          for (let i = 0; i < line.length; i++) {
            const globalIndex = lineStart + i;
            
            // 이 위치에 적용되는 색상 세그먼트 찾기
            const segment = element.colorSegments.find(seg => 
              globalIndex >= seg.start && globalIndex < seg.end
            );
            
            const nextChar = line[i + 1];
            const nextGlobalIndex = globalIndex + 1;
            const nextSegment = element.colorSegments.find(seg => 
              nextGlobalIndex >= seg.start && nextGlobalIndex < seg.end
            );
            
            // 색상이 바뀌거나 마지막 글자인 경우 렌더링
            if (!nextChar || segment?.color !== nextSegment?.color) {
              const textPart = line.substring(lastIndex, i + 1);
              ctx.fillStyle = segment?.color || element.color;
              
              // letterSpacing 적용
              if (element.letterSpacing) {
                drawTextWithLetterSpacing(ctx, textPart, currentX, y, element.letterSpacing);
                // letterSpacing이 적용된 텍스트의 너비 계산
                let partWidth = 0;
                for (let j = 0; j < textPart.length; j++) {
                  partWidth += ctx.measureText(textPart[j]).width + (j < textPart.length - 1 ? element.letterSpacing : 0);
                }
                currentX += partWidth;
              } else {
                ctx.fillText(textPart, currentX, y);
                currentX += ctx.measureText(textPart).width;
              }
              lastIndex = i + 1;
            }
          }
        } else {
          // 부분 색상이 없는 경우 전체 색상 또는 그라데이션으로 렌더링
          if (element.gradient) {
            // 좌→우 linearGradient
            const grad = ctx.createLinearGradient(element.x, element.y, element.x + element.width, element.y);
            grad.addColorStop(0, element.gradient.from);
            grad.addColorStop(1, element.gradient.to);
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = element.color;
          }
          if (element.letterSpacing) {
            drawTextWithLetterSpacing(ctx, line, currentX, y, element.letterSpacing);
          } else {
            ctx.fillText(line, currentX, y);
          }
        }
      });
      
      ctx.restore();
    });
  }, [config.name]);

  // 이미지/로고 캐싱용 useRef 추가 (URL도 함께 캐싱)
  const cachedBackgroundImg = useRef<{ src: string; url: string; img: HTMLImageElement } | null>(null);
  const cachedLogoImg = useRef<{ src: string; url: string; img: HTMLImageElement } | null>(null);
  const cachedMultiLogoImgs = useRef<{ src:string; url: string; img: HTMLImageElement }[]>([]);

  // drawBackground 함수 내 이미지/로고 로딩 최적화
  const drawBackground = useCallback(async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    setIsLoading(true);
    if (onDrawStart) onDrawStart();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 이미지
    const imageToUse = uploadedImage || existingImageUrl;
    let bgImg: HTMLImageElement | null = null;
    let bgSrc = '';
    let bgUrl = '';
    if (imageToUse) {
      bgSrc = uploadedImage ? (uploadedImage as File).name + (uploadedImage as File).size : (imageToUse as string);
      if (!cachedBackgroundImg.current || cachedBackgroundImg.current.src !== bgSrc) {
        if (cachedBackgroundImg.current && cachedBackgroundImg.current.url) {
          URL.revokeObjectURL(cachedBackgroundImg.current.url);
        }
        bgUrl = uploadedImage ? URL.createObjectURL(uploadedImage) : (imageToUse as string);
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            cachedBackgroundImg.current = { src: bgSrc, url: bgUrl, img };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = bgUrl;
        });
      }
      bgImg = cachedBackgroundImg.current?.img || null;
      if (bgImg) {
        // 이미지 비율 계산
        const imageRatio = bgImg.width / bgImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        if (imageRatio > canvasRatio) {
          drawHeight = canvas.width / imageRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imageRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }
        ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
      }
    }

    // 단일 로고
    const logoToUse = uploadedLogo || existingLogoUrl;
    let logoImg: HTMLImageElement | null = null;
    let logoSrc = '';
    let logoUrl = '';
    if (logoToUse && config.logo) {
      logoSrc = uploadedLogo ? (uploadedLogo as File).name + (uploadedLogo as File).size : (logoToUse as string);
      if (!cachedLogoImg.current || cachedLogoImg.current.src !== logoSrc) {
        if (cachedLogoImg.current && cachedLogoImg.current.url) {
          URL.revokeObjectURL(cachedLogoImg.current.url);
        }
        logoUrl = uploadedLogo ? URL.createObjectURL(uploadedLogo) : (logoToUse as string);
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            cachedLogoImg.current = { src: logoSrc, url: logoUrl, img };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = logoUrl;
        });
      }
      logoImg = cachedLogoImg.current?.img || null;
      if (logoImg) {
        // 높이 logoHeight 고정, 비율에 맞는 너비 계산
        const fixedHeight = logoHeight || 56;
        const aspectRatio = logoImg.width / logoImg.height;
        const calculatedWidth = fixedHeight * aspectRatio;
        
        ctx.drawImage(
          logoImg,
          config.logo!.x,
          config.logo!.y,
          calculatedWidth,
          fixedHeight
        );
      }
    }

    // 다중 로고 (항공팀)
    const logosToUse = uploadedLogos.length > 0 ? uploadedLogos : existingLogoUrls;
    if (logosToUse.length > 0 && config.multiLogo) {
      // 캐싱된 로고 배열 초기화
      if (
        cachedMultiLogoImgs.current.length !== logosToUse.length ||
        cachedMultiLogoImgs.current.some((c, i) => {
          const src = logosToUse[i] instanceof File ? (logosToUse[i] as File).name + (logosToUse[i] as File).size : logosToUse[i] as string;
          return c.src !== src;
        })
      ) {
        // 기존 URL revoke
        cachedMultiLogoImgs.current.forEach(c => {
          if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url);
        });
        cachedMultiLogoImgs.current = await Promise.all(
          logosToUse.map(async (logo) => {
            const src = logo instanceof File ? (logo as File).name + (logo as File).size : (logo as string);
            const url = logo instanceof File ? URL.createObjectURL(logo) : (logo as string);
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            });
            return { src, url, img };
          })
        );
      }
      const validLogos = cachedMultiLogoImgs.current;
      if (validLogos.length > 0 && config.multiLogo) {
        const logoHe = logoHeight || config.multiLogo.maxHeight;
        const logoGap = config.multiLogo.logoGap ?? 16;
        const separatorWidth = config.multiLogo.separatorWidth ?? 4;
        const logoWidths = validLogos.map(({ img }) => {
          const aspectRatio = img.width / img.height;
          return logoHe * aspectRatio;
        });
        // 첫 번째 로고 기준 X, Y
        let currentX = config.multiLogo?.x ?? 0;
        const baseY = config.multiLogo?.y ?? 0;
        validLogos.forEach(({ img }, index) => {
          const logoWidth = logoWidths[index];
          // 로고 그리기
          ctx.drawImage(
            img,
            currentX,
            baseY,
            logoWidth,
            logoHe
          );
          currentX += logoWidth;
          // 마지막 로고가 아니면 구분자 그리기
          if (index < validLogos.length - 1 && config.multiLogo) {
            const separatorHeight = logoHe * 0.8;
            const separatorX = currentX + ((logoGap - separatorWidth) / 2);
            const separatorY = baseY + (logoHe - separatorHeight) / 2;
            ctx.fillStyle = '#FFFFFF'; // 흰색으로 변경
            ctx.fillRect(separatorX, separatorY, separatorWidth, separatorHeight);
            currentX += logoGap;
          }
        });
      }
    }

    // 배경이 모두 그려진 후 콜백 실행 (로딩 상태 종료)
    if (onDrawComplete) onDrawComplete();
    setIsLoading(false);
  }, [uploadedImage, uploadedLogo, uploadedLogos, existingImageUrl, existingLogoUrl, existingLogoUrls, config.logo, config.multiLogo, logoHeight, onDrawStart, onDrawComplete]);
  
  // 렌더링 로직 통합 (더블 버퍼링 적용)
  useEffect(() => {
    const visibleCanvas = (ref as RefObject<HTMLCanvasElement>).current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!visibleCanvas || !offscreenCanvas) return;

    const visibleCtx = visibleCanvas.getContext('2d');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!visibleCtx || !offscreenCtx) return;

    const render = async () => {
      // 1. 모든 드로잉을 오프스크린 캔버스에서 수행
      await drawBackground(offscreenCtx, offscreenCanvas);
      drawTextElements(offscreenCtx, textElements);

      // 2. 완성된 결과물을 보이는 캔버스로 한번에 복사
      visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
      visibleCtx.drawImage(offscreenCanvas, 0, 0);
    };

    render();
  }, [
    ref, 
    textElements, 
    drawTextElements, 
    drawBackground, 
    uploadedImage, 
    uploadedLogo, 
    uploadedLogos, 
    existingImageUrl, 
    existingLogoUrl, 
    existingLogoUrls, 
    logoHeight, 
    config
  ]);

  // 미리보기 프레임 크기 계산 - 컨테이너에 맞게 조정
  const maxPreviewWidth = 600; // 좌측 70% 컨테이너에 맞는 크기
  const maxPreviewHeight = 400;
  
  const scaleByWidth = maxPreviewWidth / config.width;
  const scaleByHeight = maxPreviewHeight / config.height;
  const previewScale = Math.min(scaleByWidth, scaleByHeight, 1); // 1을 넘지 않도록
  
  const previewWidth = config.width * previewScale;
  const previewHeight = config.height * previewScale;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-3">
        미리보기
        <span className="text-sm text-gray-500 ml-2">
          ({config.width} × {config.height})
        </span>
      </h2>
      <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
        <div className="relative" style={{ width: previewWidth, height: previewHeight }}>
          <canvas
            ref={ref}
            width={config.width}
            height={config.height}
            className="border-2 border-gray-300 rounded-lg shadow-sm w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              backgroundColor: '#f8f9fa'
            }}
          />
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              fontSize: 24,
              fontWeight: 'bold',
              color: '#2563eb',
              borderRadius: 12
            }}>
              로딩중...
            </div>
          )}
          {/* 드래그 리사이즈 핸들 (오른쪽 아래) */}
          {(uploadedLogo || (uploadedLogos && uploadedLogos.length > 0)) && (
            <div
              style={{
                position: 'absolute',
                left: handleX * previewScale,
                top: handleY * previewScale,
                width: handleW,
                height: handleH,
                cursor: 'nwse-resize',
                zIndex: 10,
                background: dragging ? '#2563eb' : '#fff',
                border: '2px solid #2563eb',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}
              onMouseDown={onHandleMouseDown}
            >
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 10h8M10 10V2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});