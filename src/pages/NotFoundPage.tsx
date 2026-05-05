import React from 'react';
import { Link } from 'react-router-dom';
import Container from '@/components/Shared/Container';

const NotFoundPage: React.FC = () => {
  return (
    <Container className="text-center py-16">
      {' '}
      {/* Added padding */}
      <h1 className="text-6xl font-bold text-[#FF6B00] mb-4">404</h1>
      <p className="text-2xl text-[#eaecef] mb-8">Oops! Page Not Found</p>
      <p className="text-[#848e9c] mb-8">
        The page you are looking for might have been removed, had its name changed, is temporarily
        unavailable or I'm afraid that you fat-fingered it, my friend.
      </p>
      <img
        src="/fatfinger.png"
        alt="A fat finger... perhaps yours?"
        className="mx-auto mb-8"
        style={{ maxWidth: '200px' }}
      />
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-[#FF6B00] text-[#0b0e11] font-bold rounded-sm hover:opacity-90 transition duration-300"
      >
        Go to Homepage
      </Link>
      <p className="text-[#848e9c] mt-8 text-xs">
        Photo by{' '}
        <a href="https://unsplash.com/@glencarrie?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
          Glen Carrie
        </a>{' '}
        on{' '}
        <a href="https://unsplash.com/photos/persons-finger-with-white-background-UQ7TSF5YpJE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
          Unsplash
        </a>
      </p>
    </Container>
  );
};

export default NotFoundPage;
