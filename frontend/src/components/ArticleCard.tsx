import React from "react";
import { Article } from "@/types/api";

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <a
      key={article.id}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      {article.url_to_image && (
        <img
          src={article.url_to_image}
          alt={article.title}
          className="w-full h-48 object-cover object-center"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/600x400/CCCCCC/333333?text=No+Image`; // Placeholder on error
          }}
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {article.description || article.content}
        </p>
        <div className="flex flex-wrap items-center text-xs text-gray-500">
          {article.source && (
            <span className="mr-3 flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.707 9.293a1 1 0 00-1.414 1.414L8.586 12l-1.293 1.293a1 1 0 101.414 1.414L10 13.414l1.293 1.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293a1 1 0 00-1.414-1.414L10 10.586l-1.293-1.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {article.source.name}
            </span>
          )}
          {article.category && (
            <span className="mr-3 flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-purple-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"></path>
              </svg>
              {article.category.name}
            </span>
          )}
          {article.author && (
            <span className="mr-3 flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {article.author}
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {new Date(article.published_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </a>
  );
};

export default ArticleCard;
