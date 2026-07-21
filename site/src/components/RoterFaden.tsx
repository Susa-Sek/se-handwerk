import { useScroll } from '../context/ScrollContext';

export default function RoterFaden() {
  const { docProgress } = useScroll();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 26,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'rgba(201,154,69,0.18)',
          zIndex: 90,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 26,
          top: 0,
          width: 2,
          zIndex: 91,
          pointerEvents: 'none',
          background: '#C99A45',
          boxShadow: '0 0 10px rgba(201,154,69,0.45)',
          height: `${(docProgress * 100).toFixed(2)}vh`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: -3,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#C99A45',
            boxShadow: '0 0 12px 2px rgba(201,154,69,0.55)',
          }}
        />
      </div>
    </>
  );
}
