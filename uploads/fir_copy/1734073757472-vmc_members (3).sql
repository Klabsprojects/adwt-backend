-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 12, 2024 at 09:23 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `adw_database`
--

-- --------------------------------------------------------

--
-- Table structure for table `vmc_members`
--

CREATE TABLE `vmc_members` (
  `id` int(11) NOT NULL,
  `vmc_id` varchar(200) NOT NULL,
  `salutation` varchar(10) NOT NULL,
  `member_type` enum('Official Member','Non-Official Member') NOT NULL,
  `name` varchar(255) NOT NULL,
  `level_of_member` varchar(22) NOT NULL,
  `district` varchar(255) DEFAULT NULL,
  `subdivision` varchar(255) DEFAULT NULL,
  `designation` varchar(255) NOT NULL,
  `other_designation` varchar(255) DEFAULT NULL,
  `meeting_date` date NOT NULL,
  `validity_end_date` date NOT NULL,
  `status` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `vmc_members`
--

INSERT INTO `vmc_members` (`id`, `vmc_id`, `salutation`, `member_type`, `name`, `level_of_member`, `district`, `subdivision`, `designation`, `other_designation`, `meeting_date`, `validity_end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, '', 'Mr', 'Official Member', 'New', 'Subdivision', 'Nagapattinam', 'Kelvellur', 'Nwew', 'Nan', '2024-12-11', '2024-12-11', 1, '2024-12-11 14:37:40', '2024-12-12 07:02:05'),
(2, 'ucfmGQ', 'Mr', 'Official Member', 'dsfdsfs', 'State Level', NULL, NULL, 'Chief Minister', NULL, '2024-12-11', '2024-12-11', 1, '2024-12-11 17:47:49', '2024-12-11 17:47:49'),
(5, '0H1UtR', 'Mr', 'Official Member', 'sadsd', 'State Level', 'Karur', 'Karur', 'Minister Adi Dravidar Welfare', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:01:59', '2024-12-12 11:01:59'),
(6, 'LwTd36', 'Mr', 'Official Member', 'ssad', 'State Level', 'Ariyalur', 'RDO, Ariyalur', 'Chief Minister', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:03:53', '2024-12-12 11:03:53'),
(7, '3I7Ivg', 'Mr', 'Official Member', 'sadasd', 'State Level', 'Karur', 'Karur', 'Chief Minister', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:05:41', '2024-12-12 11:05:41'),
(8, 'EC33CL', 'Mr', 'Official Member', 'bala', 'State Level', 'Nagapattinam', 'RDO, Vedharanyam', 'Chief Minister', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:12:35', '2024-12-12 11:12:35'),
(9, 'epsxP8', 'Mr', 'Official Member', 'dggg', 'Subdivision', 'Chengalpattu', 'RDO, Chengalpet', 'Chief Minister', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:14:21', '2024-12-12 11:14:21'),
(10, 'GOHPWD', 'Mr', 'Official Member', 'ssdsd', 'State Level', 'Nagapattinam', 'RDO, Nagapattinam', 'Chief Minister', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:24:52', '2024-12-12 11:24:52'),
(11, 'hXhWbC', 'Mr', 'Official Member', 'cvcvvcv', 'District Level', 'Perambalur', 'RDO, Perambalur', 'Minister Adi Dravidar Welfare', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:33:53', '2024-12-12 11:33:53'),
(12, '8i5boc', 'Mr', 'Official Member', 'New Test', 'Subdivision', 'Sivagangai', 'RDO, Devakottai', 'Chief Minister', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 11:42:02', '2024-12-12 11:42:02'),
(13, 'yaNGkw', 'Ms', 'Non-Official Member', 'sasas', 'State Level', 'Ramanathapuram', 'RDO, Paramakudi', 'Special Public Prosecutor', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 12:09:48', '2024-12-12 12:09:48'),
(14, 'cD4v0P', 'Mr', 'Official Member', 'sfsfds', 'State Level', '', '', 'Special Public Prosecutor', NULL, '0000-00-00', '2024-12-13', 2024, '2024-12-12 12:43:55', '2024-12-12 12:43:55'),
(15, 'v4sq5K', 'Mr', 'Official Member', 'rfgfd', 'State Level', '', '', 'Superintendent of Police', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 12:58:16', '2024-12-12 12:58:16'),
(16, 'kO45ce', 'Mr', 'Official Member', 'jygddsf', 'District Level', 'Perambalur', '', 'DADTWO', NULL, '0000-00-00', '2024-12-13', 2024, '2024-12-12 13:03:37', '2024-12-12 13:03:37'),
(17, 'lerHJ0', 'Mr', 'Official Member', 'rtytytry', 'State Level', '', '', 'Superintendent of Police', NULL, '0000-00-00', '2024-12-12', 2024, '2024-12-12 13:04:08', '2024-12-12 13:04:08'),
(18, 'y4oQGH', 'Mr', 'Official Member', 'egrr', 'State Level', '', '', 'Special Public Prosecutor', NULL, '2024-12-12', '0000-00-00', 2024, '2024-12-12 13:06:26', '2024-12-12 13:06:26'),
(19, 'i0lxpB', 'Mr', 'Official Member', 'rrgg', 'State Level', '', '', 'Special Public Prosecutor', NULL, '2024-12-12', '2024-12-13', 1, '2024-12-12 13:07:24', '2024-12-12 13:07:24'),
(20, 'hmK3vk', 'Mr', 'Official Member', 'dgdg', 'State Level', '', '', 'Special Public Prosecutor', NULL, '2024-12-12', '2024-12-14', 1, '2024-12-12 13:08:42', '2024-12-12 13:08:42'),
(21, 'mNpWu9', 'Mr', 'Official Member', 'gtrtrh', 'State Level', '', '', 'Special Public Prosecutor', NULL, '2024-12-12', '2024-12-20', 1, '2024-12-12 13:16:29', '2024-12-12 13:16:29'),
(22, 'ojri9D', 'Mr', 'Official Member', 'rgdgdf', 'State Level', '', '', 'Special Public Prosecutor', NULL, '2024-12-13', '2024-12-14', 1, '2024-12-12 13:31:37', '2024-12-12 13:31:37'),
(23, 'JIuJxC', 'Mr', 'Official Member', 'csccs', 'State Level', '', '', 'Minister Adi Dravidar Welfare', NULL, '2024-12-13', '2024-12-13', 1, '2024-12-12 18:14:31', '2024-12-12 18:14:31'),
(24, 'G12r9K', 'Mr', 'Non-Official Member', 'erefsd', 'Subdivision', 'Nagapattinam', 'RDO, Vedharanyam', 'Chief Secretary', NULL, '2024-12-12', '2024-12-14', 1, '2024-12-12 18:40:34', '2024-12-12 18:40:34'),
(25, 'qwe9vE', 'Mr', 'Official Member', 'dsdsad', 'State Level', '', '', 'Others', NULL, '2024-12-14', '2024-12-20', 1, '2024-12-12 18:40:59', '2024-12-12 18:40:59'),
(26, 'Jcrlsc', 'Mr', 'Official Member', 'rwdw', 'District Level', 'Namakkal', '', 'Others', NULL, '2024-12-21', '2024-12-15', 1, '2024-12-12 18:43:37', '2024-12-12 18:43:37'),
(27, 'AEJx41', 'Mr', 'Official Member', 'eddss', 'District Level', 'Perambalur', '', 'Others', NULL, '2024-12-13', '2024-12-15', 1, '2024-12-12 18:49:36', '2024-12-12 18:49:36'),
(28, 'diOHTw', 'Mr', 'Official Member', 'fff', 'State Level', '', '', 'Others', NULL, '2024-12-13', '2024-12-13', 1, '2024-12-12 18:50:37', '2024-12-12 18:50:37'),
(29, '[value-2]', '[value-3]', '', '[value-5]', '[value-6]', '[value-7]', '[value-8]', '[value-9]', 'ssaasas', '0000-00-00', '0000-00-00', 0, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(30, 'pGZozs', 'Mr', 'Official Member', 'sxxsx', 'State Level', '', '', 'Others', NULL, '2024-12-13', '2024-12-13', 1, '2024-12-12 18:59:27', '2024-12-12 18:59:27'),
(31, '9kWILj', 'Mr', 'Official Member', 'xz', 'District Level', 'Pudukkottai', '', 'Others', NULL, '2024-12-26', '2024-12-14', 1, '2024-12-12 19:01:34', '2024-12-12 19:01:34'),
(32, 'x9cpFW', 'Mr', 'Official Member', 'sss', 'State Level', '', '', 'Others', NULL, '2024-12-13', '2024-12-14', 1, '2024-12-12 19:03:10', '2024-12-12 19:03:10'),
(33, 'y1Xde2', 'Mr', 'Official Member', 'cxcxcx', 'State Level', '', '', 'Superintendent of Police', '', '2024-12-14', '2024-12-14', 1, '2024-12-12 19:08:16', '2024-12-12 19:08:16'),
(36, '9Y8hDu', 'Mr', 'Official Member', 'Joseph Vijay', 'Subdivision', 'Ranipet', 'RDO, Arakkonam', 'Others', 'CM-TVK', '2024-12-12', '2026-07-13', 1, '2024-12-12 19:12:26', '2024-12-12 19:48:40');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `vmc_members`
--
ALTER TABLE `vmc_members`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `vmc_members`
--
ALTER TABLE `vmc_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
