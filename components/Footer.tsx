
import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
        <p>طراحی با تیم هوش مصنوعی رئال ربات</p>
        <p>
          &copy; {currentYear}{' '}
          <a
            href="https://realrobot.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            realrobot.ir
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
