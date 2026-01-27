import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#39653f] text-white">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="text-center space-y-4 sm:space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img src="/logo.png" alt="晶順出國停車場" className="h-8 sm:h-12 w-auto" />
          </div>
          
          {/* Content */}
          <div className="max-w-4xl mx-auto">
            <p className="text-white/90 leading-relaxed text-sm sm:text-base md:text-lg px-2">
              晶順出國停車場位於大園區，桃園機場外圍。我們提供多元化的停車服務，包括露天停車場與室內停車場，滿足不同出國的顧客需求。此外，我們還提供24小時免費機場接送服務，確保您從停車場到機場航廈的過程快速、安全、無縫銜接，讓您的旅程從一開始就充滿愉快與便利…
            </p>
            <div className="mt-4">
              <a 
                href="https://jingparking.com/about-us/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-white/80 transition-colors text-sm sm:text-base"
              >
                繼續了解我們
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 