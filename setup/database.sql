-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 28, 2023 at 05:12 AM
-- Server version: 8.0.31
-- PHP Version: 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `arbitrage`
--

-- --------------------------------------------------------

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
CREATE TABLE IF NOT EXISTS `config` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Config ID',
  `name` varchar(255) NOT NULL COMMENT 'Config Key',
  `value` text NOT NULL COMMENT 'Config Value',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `config`
--

INSERT INTO `config` (`id`, `name`, `value`) VALUES
(1, 'symbol', '0');

-- --------------------------------------------------------

--
-- Table structure for table `trades`
--

DROP TABLE IF EXISTS `trades`;
CREATE TABLE IF NOT EXISTS `trades` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Trade ID',
  `buy_ex` varchar(255) NOT NULL COMMENT 'Exchange bought from',
  `sell_ex` varchar(255) NOT NULL COMMENT 'Exchange sold to',
  `buy_symbol` varchar(255) NOT NULL COMMENT 'Buy symbol',
  `sell_symbol` varchar(255) NOT NULL COMMENT 'Sell symbol',
  `buy_bid` float(16,8) NOT NULL COMMENT 'Buy bid value',
  `sell_ask` float(16,8) NOT NULL COMMENT 'Sell ask value',
  `buy_quote` float(16,2) NOT NULL COMMENT 'Buy value (Quote value)',
  `sell_base` float(16,8) NOT NULL COMMENT 'Sell value (Base value)',
  `profit` float(10,2) NOT NULL COMMENT 'Potential profit (USD)',
  `added` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Added date',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
