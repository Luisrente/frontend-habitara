function UserIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12.75c2.76 0 5-2.13 5-4.75S14.76 3.25 12 3.25 7 5.38 7 8s2.24 4.75 5 4.75Zm-6.5 7.5c.72-2.34 3.1-4 6.5-4s5.78 1.66 6.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default UserIcon;
