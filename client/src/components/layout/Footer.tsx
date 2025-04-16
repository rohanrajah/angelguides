import React from 'react';
import { Link } from 'wouter';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-darkest text-white mt-10 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <i className="fas fa-spa text-primary text-2xl mr-2"></i>
              <h3 className="font-heading text-xl font-semibold">Ethereal Advisors</h3>
            </div>
            <p className="text-neutral-light text-sm mb-4">
              Connecting you with spiritual guidance and wisdom for your personal and professional journey.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral hover:text-primary transition duration-200">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-neutral hover:text-primary transition duration-200">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-neutral hover:text-primary transition duration-200">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-neutral hover:text-primary transition duration-200">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading text-lg font-medium mb-4">Features</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">AI Concierge</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Advisor Matching</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Session Booking</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Spiritual Guidance</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Personal Dashboard</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading text-lg font-medium mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Blog</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Guides</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">FAQ</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Support Center</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Advisor Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading text-lg font-medium mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">About Us</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Careers</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-neutral-light hover:text-primary transition duration-200 text-sm">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-dark flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral text-sm">&copy; {new Date().getFullYear()} Ethereal Advisors. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <a href="#" className="text-neutral text-sm hover:text-primary transition duration-200">Privacy Policy</a>
            <span className="text-neutral">•</span>
            <a href="#" className="text-neutral text-sm hover:text-primary transition duration-200">Terms of Service</a>
            <span className="text-neutral">•</span>
            <a href="#" className="text-neutral text-sm hover:text-primary transition duration-200">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
