export const couponLabel = (c) =>
  c.discount_type === 'percent' ? `${c.discount_value}% 할인` : `${c.discount_value.toLocaleString('ko-KR')}원 할인`
