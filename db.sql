-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 02, 2024 at 10:56 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

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
-- Table structure for table `accuseds`
--

CREATE TABLE `accuseds` (
  `id` int(11) NOT NULL,
  `accused_id` varchar(10) DEFAULT NULL,
  `fir_id` varchar(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `pincode` varchar(200) DEFAULT NULL,
  `community` varchar(50) DEFAULT NULL,
  `caste` varchar(50) DEFAULT NULL,
  `guardian_name` varchar(255) DEFAULT NULL,
  `previous_incident` tinyint(1) DEFAULT NULL,
  `previous_fir_number` varchar(10) DEFAULT NULL,
  `previous_fir_number_suffix` varchar(10) DEFAULT NULL,
  `scst_offence` tinyint(1) DEFAULT NULL,
  `scst_fir_number` varchar(10) DEFAULT NULL,
  `scst_fir_number_suffix` varchar(10) DEFAULT NULL,
  `antecedents` varchar(500) DEFAULT NULL,
  `land_o_issues` varchar(600) DEFAULT NULL,
  `gist_of_current_case` varchar(600) DEFAULT NULL,
  `upload_fir_copy` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accuseds`
--

INSERT INTO `accuseds` (`id`, `accused_id`, `fir_id`, `age`, `name`, `gender`, `address`, `pincode`, `community`, `caste`, `guardian_name`, `previous_incident`, `previous_fir_number`, `previous_fir_number_suffix`, `scst_offence`, `scst_fir_number`, `scst_fir_number_suffix`, `antecedents`, `land_o_issues`, `gist_of_current_case`, `upload_fir_copy`) VALUES
(1, 'qSuaAG', 'rDbj99', 22, 'Bala', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Bala', 0, '', '', 0, '', '', 'dsdsdf', 'sdfdsf', 'sdfsddsf', 'C:\\fakepath\\Inter-Regular.woff2'),
(2, '1kObHd', 'rDbj99', 22, 'Bala', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Bala', 0, '', '', 0, '', '', 'dsdsdf', 'sdfdsf', 'sdfsddsf', 'C:\\fakepath\\Inter-Regular.woff2'),
(3, '2INq70', 'xBpUeo', 25, 'Bala', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'asdas', 'asdsa', 'asasdsad', 'C:\\fakepath\\Inter-Regular.woff2'),
(4, 'Gmz0Pc', 'xBpUeo', 25, 'Bala', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'asdas', 'asdsa', 'asasdsad', 'C:\\fakepath\\Inter-Regular.woff2'),
(5, '6UDTFh', 'XIJwze', 36, 'Chennai', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'sdsad', 'asdasd', 'asdasdsadasddfgfghhgf', 'C:\\fakepath\\Inter-Regular.woff2'),
(6, 'UdnO4T', 'XIJwze', 36, 'Chennai', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'sdsad', 'asdasd', 'asdasdsadasddfgfghhgf', 'C:\\fakepath\\Inter-Regular.woff2'),
(7, 'sqakTM', 'XIJwze', 36, 'Chennai', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'sdsad', 'asdasd', 'asdasdsadasddfgfghhgf', 'C:\\fakepath\\Inter-Regular.woff2'),
(8, 'QH9Ncs', 'XIJwze', 36, 'Chennai', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'sdsad', 'asdasd', 'asdasdsadasddfgfghhgf', 'C:\\fakepath\\Inter-Regular.woff2'),
(9, 'FRQyQU', 'ZV6WwR', 18, 'Bala', 'Male', 'chennai', '611002', 'OC', 'Thevar', 'Bala', 0, '', '', 0, '', '', 'dsds', 'sdsd', 'sdfsdfdsf', 'C:\\fakepath\\Inter-Regular.woff2'),
(10, 'FvNBVX', 'ZV6WwR', 18, 'Bala', 'Male', 'chennai', '611002', 'OC', 'Thevar', 'Bala', 0, '', '', 0, '', '', 'dsds', 'sdsd', 'sdfsdfdsf', 'C:\\fakepath\\Inter-Regular.woff2'),
(11, 'hUB3Gh', 'PfaDPZ', 63, 'Ehs', 'Male', 'Bala', '611002', 'OC', 'Thevar', 'Chennai', 0, '15', '2009', 0, '', '', '', 'asdsad', 'sadasd', 'C:\\fakepath\\Inter-Regular.woff2'),
(12, 'IVAGwN', 'PfaDPZ', 63, 'Ehs', 'Male', 'Bala', '611002', 'OC', 'Thevar', 'Chennai', 0, '15', '2009', 0, '', '', 'sdsad', 'asdsad', 'sadasd', 'C:\\fakepath\\Inter-Regular.woff2'),
(13, 'jL3w5H', 'PfaDPZ', 63, 'Ehs', 'Male', 'Bala', '611002', 'OC', 'Thevar', 'Chennai', 0, '15', '2009', 0, '', '', 'sdsad', 'asdsad', 'sadasd', 'C:\\fakepath\\Inter-Regular.woff2'),
(14, 'c4mMUt', 'hQ0VKN', 89, 'Bala', 'Female', 'sdfsd', '611002', 'BC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'dfgdfgfdg', 'dfgdfg', 'fdgdf', 'C:\\fakepath\\Inter-Regular.woff2'),
(15, 'jd5nVB', 'hQ0VKN', 89, 'Bala', 'Female', 'sdfsd', '611002', 'BC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'dfgdfgfdg', 'dfgdfg', 'fdgdf', 'C:\\fakepath\\Inter-Regular.woff2'),
(16, 'z8xrG8', 'hQ0VKN', 89, 'Bala', 'Female', 'sdfsd', '611002', 'BC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'dfgdfgfdg', 'dfgdfg', 'fdgdf', 'C:\\fakepath\\Inter-Regular.woff2'),
(17, 'tu4CxJ', 'azDrHr', 26, 'New', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Test', 0, '1', '2024', 0, '15', '2009', 'Test', 'TEst', 'sdfdsfdsf', 'C:\\fakepath\\Inter-Regular.woff2'),
(18, '1kpM0S', 'azDrHr', 26, 'New', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Test', 0, '1', '2024', 0, '15', '2009', 'Test', 'TEst', 'sdfdsfdsf', 'C:\\fakepath\\Inter-Regular.woff2'),
(19, 'swQoB1', 'azDrHr', 26, 'New', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Test', 0, '1', '2024', 0, '15', '2009', 'Test', 'TEst', 'sdfdsfdsf', 'C:\\fakepath\\Inter-Regular.woff2'),
(20, 'dl8mds', 'wlYiCd', 56, 'Ela', 'Male', 'chennai', '611002', 'OC', 'Thevar', 'chennai', 0, '1', '2023', 0, '15', '2008', 'chennai', 'asdsad', 'asdasdsad', 'C:\\fakepath\\Inter-Regular.woff2'),
(21, 'iegN3U', 'wlYiCd', 56, 'Ela', 'Male', 'chennai', '611002', 'OC', 'Thevar', 'chennai', 0, '1', '2023', 0, '15', '2008', 'chennai', 'asdsad', 'asdasdsad', 'C:\\fakepath\\Inter-Regular.woff2'),
(22, '16b2l8', 'NM6YwR', 25, 'bala', 'Male', 'chennai', '611002', 'OC', 'Thevar', 'chennai', 0, '1', '2023', 0, '', '', 'sdasdsa', 'asdasd', 'asdasd', 'C:\\fakepath\\investigating_officers (1).csv'),
(23, 'pIqrFl', 'SrHWRe', 63, 'sdsad', 'Female', 'asdsad', '611002', 'OC', 'Nadar', 'asdasd', 0, '', '', 0, '', '', 'asd', 'sadasd', 'asdasd', 'C:\\fakepath\\investigating_officers (1).csv'),
(24, 'hj5QI9', 'C35smE', 36, 'sadsdsd', 'Female', 'sdsd', '611002', 'OC', 'Thevar', 'sdsad', 0, '', '', 0, '', '', 'sdsad', 'asdas', 'sadasd', 'C:\\fakepath\\Inter-Regular.woff2'),
(25, '3J7LLY', 'Sjn7Xf', 23, 'Bala', 'Male', 'sdfsdfsd', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'sdfsdf', 'sddsf', 'Chennai', 'C:\\fakepath\\investigating_officers (1).csv'),
(26, 'OyyrIj', 'kOiwdF', 36, 'Bala', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'dsfsdf', 'sdfsdf', 'sdfsdf', 'C:\\fakepath\\investigating_officers (1).csv'),
(27, '9vffd8', 'kOiwdF', 36, 'Bala', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'dsfsdf', 'sdfsdf', 'sdfsdf', 'C:\\fakepath\\investigating_officers (1).csv'),
(28, 'ostRFR', 'kOiwdF', 36, 'Bala', 'Male', 'Chennai', '611002', 'OC', 'Thevar', 'Chennai', 0, '', '', 0, '', '', 'dsfsdf', 'sdfsdf', 'sdfsdf', 'C:\\fakepath\\investigating_officers (1).csv'),
(29, '6bZO9X', 'ZuWzft', 26, 'Bala', 'Male', 'Bala', '611002', 'OC', 'Thevar', 'fdgdf', 0, '', '', 0, '', '', 'fewrwerewrwer', 'fsdfs', 'dgdfg', 'C:\\fakepath\\FIR UI Design.pdf');

-- --------------------------------------------------------

--
-- Table structure for table `altered_case_details`
--

CREATE TABLE `altered_case_details` (
  `altered_case_id` int(11) NOT NULL,
  `fir_id` int(11) NOT NULL,
  `altered_nature_of_offence` varchar(255) NOT NULL,
  `altered_poa_sections` varchar(255) DEFAULT NULL,
  `altered_sections_ipc` text DEFAULT NULL,
  `altered_date_of_occurrence` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `caste_community`
--

CREATE TABLE `caste_community` (
  `id` int(11) NOT NULL,
  `caste_name` varchar(255) NOT NULL,
  `community_name` varchar(255) NOT NULL,
  `status` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `caste_community`
--

INSERT INTO `caste_community` (`id`, `caste_name`, `community_name`, `status`, `created_at`, `updated_at`) VALUES
(2, 'Thevar', 'MBC', 0, '2024-10-04 06:56:30', '2024-10-04 06:56:30'),
(3, 'Nadar', 'OBC', 1, '2024-10-04 06:56:30', '2024-10-04 06:56:30'),
(4, 'Chettiar', 'General', 0, '2024-10-04 06:56:30', '2024-10-04 06:56:30'),
(5, 'Vellalar', 'OBC', 1, '2024-10-04 07:01:51', '2024-10-04 07:01:51');

-- --------------------------------------------------------

--
-- Table structure for table `city`
--

CREATE TABLE `city` (
  `id` int(11) NOT NULL,
  `district_name` varchar(255) DEFAULT NULL,
  `city_name` varchar(255) DEFAULT NULL,
  `status` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `city`
--

INSERT INTO `city` (`id`, `district_name`, `city_name`, `status`) VALUES
(1, 'Chennai', 'Chennai City', 1),
(2, 'Chennai', 'Ambattur', 1),
(3, 'Chennai', 'Avadi', 1),
(4, 'Coimbatore', 'Coimbatore City', 1),
(5, 'Coimbatore', 'Pollachi', 1),
(6, 'Coimbatore', 'Mettupalayam', 1),
(7, 'Tiruchirappalli', 'Trichy', 1);

-- --------------------------------------------------------

--
-- Table structure for table `counter_case_details`
--

CREATE TABLE `counter_case_details` (
  `counter_case_id` int(11) NOT NULL,
  `fir_id` int(11) NOT NULL,
  `counter_fir_number` varchar(255) NOT NULL,
  `counter_fir_suffix` varchar(50) DEFAULT NULL,
  `counter_nature_of_offence` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `district`
--

CREATE TABLE `district` (
  `id` int(11) NOT NULL,
  `district_name` varchar(255) NOT NULL,
  `status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `district`
--

INSERT INTO `district` (`id`, `district_name`, `status`) VALUES
(1, 'Ariyalur', 1),
(2, 'Chengalpattu', 1),
(3, 'Chennai', 1),
(4, 'Coimbatore', 1),
(5, 'Cuddalore', 1),
(6, 'Dharmapuri', 1),
(7, 'Dindigul', 1),
(8, 'Erode', 1),
(9, 'Kallakurichi', 1),
(10, 'Kanchipuram', 1),
(11, 'Kanyakumari', 1),
(12, 'Karur', 1),
(13, 'Krishnagiri', 1),
(14, 'Madurai', 1),
(15, 'Nagapattinam', 1),
(16, 'Namakkal', 1),
(17, 'Nilgiris', 1),
(18, 'Perambalur', 1),
(19, 'Pudukkottai', 1),
(20, 'Ramanathapuram', 1),
(21, 'Ranipet', 1),
(22, 'Salem', 1),
(23, 'Sivagangai', 1),
(24, 'Tenkasi', 1),
(25, 'Thanjavur', 1),
(26, 'Theni', 1),
(27, 'Thoothukudi', 1),
(28, 'Tiruchirappalli', 1),
(29, 'Tirunelveli', 1),
(30, 'Tirupattur', 1),
(31, 'Tiruppur', 1),
(32, 'Tiruvallur', 1),
(33, 'Tiruvannamalai', 1),
(34, 'Tiruvarur', 1),
(35, 'Vellore', 1),
(36, 'Viluppuram', 1),
(37, 'Virudhunagar', 1),
(38, 'Mayiladuthurai', 1);

-- --------------------------------------------------------

--
-- Table structure for table `district_revenue`
--

CREATE TABLE `district_revenue` (
  `id` int(11) NOT NULL,
  `revenue_district_name` varchar(255) NOT NULL,
  `status` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `district_revenue`
--

INSERT INTO `district_revenue` (`id`, `revenue_district_name`, `status`) VALUES
(1, 'Ariyalur', 1),
(2, 'Chengalpattu', 1),
(3, 'Chennai', 1),
(4, 'Coimbatore', 1),
(5, 'Cuddalore', 1),
(6, 'Dharmapuri', 1),
(7, 'Dindigul', 1),
(8, 'Erode', 1),
(9, 'Kallakurichi', 1),
(10, 'Kancheepuram', 1),
(11, 'Kanniyakumari', 1),
(12, 'Karur', 1),
(13, 'Krishnagiri', 1),
(14, 'Madurai', 1),
(15, 'Mayiladuthurai', 1),
(16, 'Nagapattinam', 1),
(17, 'Namakkal', 1),
(18, 'Perambalur', 1),
(19, 'Pudukkottai', 1),
(20, 'Ramanathapuram', 1),
(21, 'Ranipet', 1),
(22, 'Salem', 1),
(23, 'Sivagangai', 1),
(24, 'Tenkasi', 1),
(25, 'Thanjavur', 1),
(26, 'The Nilgiris', 1),
(27, 'Theni', 1),
(28, 'Tiruvannamalai', 1),
(29, 'Thoothukudi', 1),
(30, 'Tiruchirappalli', 1),
(31, 'Tirunelveli', 1),
(32, 'Tirupathur', 1),
(33, 'Tiruppur', 1),
(34, 'Tiruvallur', 1),
(35, 'Tiruvarur', 1),
(36, 'Vellore', 1),
(37, 'Villupuram', 1),
(38, 'Virudhunagar', 1);

-- --------------------------------------------------------

--
-- Table structure for table `fir_add`
--

CREATE TABLE `fir_add` (
  `id` int(11) NOT NULL,
  `fir_id` varchar(36) DEFAULT NULL,
  `police_city` varchar(255) DEFAULT NULL,
  `police_zone` varchar(255) DEFAULT NULL,
  `police_range` varchar(255) DEFAULT NULL,
  `revenue_district` varchar(255) DEFAULT NULL,
  `police_station` varchar(255) DEFAULT NULL,
  `fir_number` varchar(50) DEFAULT NULL,
  `fir_number_suffix` varchar(50) DEFAULT NULL,
  `date_of_occurrence` date NOT NULL,
  `time_of_occurrence` time NOT NULL,
  `place_of_occurrence` varchar(255) DEFAULT NULL,
  `date_of_registration` date NOT NULL,
  `time_of_registration` time NOT NULL,
  `nature_of_offence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `sections_ipc` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `number_of_accused` int(11) DEFAULT NULL,
  `number_of_victim` varchar(200) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `status` tinyint(4) DEFAULT 1,
  `is_deceased` varchar(3) DEFAULT 'No',
  `deceased_person_names` text DEFAULT NULL,
  `name_of_complainant` varchar(255) DEFAULT NULL,
  `mobile_number_of_complainant` varchar(15) DEFAULT NULL,
  `is_victim_same_as_complainant` varchar(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fir_add`
--

INSERT INTO `fir_add` (`id`, `fir_id`, `police_city`, `police_zone`, `police_range`, `revenue_district`, `police_station`, `fir_number`, `fir_number_suffix`, `date_of_occurrence`, `time_of_occurrence`, `place_of_occurrence`, `date_of_registration`, `time_of_registration`, `nature_of_offence`, `sections_ipc`, `number_of_accused`, `number_of_victim`, `created_by`, `created_at`, `updated_by`, `updated_at`, `status`, `is_deceased`, `deceased_person_names`, `name_of_complainant`, `mobile_number_of_complainant`, `is_victim_same_as_complainant`) VALUES
(1, '2DM9H2', 'Dindigul', 'South Zone', 'Dindigul Range', 'Dindigul', 'A-1-chennai', NULL, NULL, '0000-00-00', '00:00:00', NULL, '0000-00-00', '00:00:00', NULL, NULL, NULL, NULL, NULL, '2024-11-02 12:27:57', NULL, '2024-11-02 12:29:47', 0, 'No', NULL, NULL, NULL, NULL),
(2, '6LZ9XO', 'Dindigul', 'South Zone', 'Dindigul Range', 'Dindigul', 'A-1-chennai', NULL, NULL, '0000-00-00', '00:00:00', NULL, '0000-00-00', '00:00:00', NULL, NULL, NULL, NULL, NULL, '2024-11-02 12:32:25', NULL, '2024-11-02 12:32:40', 0, 'No', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `fir_attachments`
--

CREATE TABLE `fir_attachments` (
  `id` int(11) NOT NULL,
  `attachment_id` varchar(36) DEFAULT NULL,
  `fir_id` varchar(36) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fir_compensation`
--

CREATE TABLE `fir_compensation` (
  `id` int(11) NOT NULL,
  `compensation_id` varchar(36) DEFAULT NULL,
  `fir_id` varchar(36) NOT NULL,
  `total_compensation` decimal(10,2) DEFAULT NULL,
  `proceedings_file_no` varchar(100) DEFAULT NULL,
  `proceedings_date` date DEFAULT NULL,
  `proceedings_file` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investigating_officers`
--

CREATE TABLE `investigating_officers` (
  `id` int(11) NOT NULL,
  `officer_id` varchar(36) DEFAULT NULL,
  `fir_id` varchar(36) DEFAULT NULL,
  `officer_name` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investigating_officers`
--

INSERT INTO `investigating_officers` (`id`, `officer_id`, `fir_id`, `officer_name`, `designation`, `phone_number`) VALUES
(1, '9pzxZn', '2DM9H2', 'bala', 'DSP', '8056496398'),
(2, 'xNqEHz', '2DM9H2', 'bala', 'DSP', '8056496398'),
(3, 'u3BOHW', '6LZ9XO', 'chennai', 'DSP', '8056496398'),
(4, 'N2qpJG', '6LZ9XO', 'chenna', 'DSP', '8056496398');

-- --------------------------------------------------------

--
-- Table structure for table `offence`
--

CREATE TABLE `offence` (
  `id` int(11) NOT NULL,
  `offence_name` varchar(255) NOT NULL,
  `status` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `offence`
--

INSERT INTO `offence` (`id`, `offence_name`, `status`) VALUES
(1, 'Theft', 1),
(2, 'Assault ', 1),
(3, 'New', 1),
(4, 'Fraud', 1),
(5, 'Arson', 1),
(6, 'Drug Possession', 1),
(7, 'Burglary', 1),
(8, 'Homicide', 1),
(9, 'Kidnapping', 1),
(10, 'Domestic Violence', 1),
(11, 'Rape', 1),
(12, 'ffasd', 1),
(13, 'New 1', 1);

-- --------------------------------------------------------

--
-- Table structure for table `offence_acts`
--

CREATE TABLE `offence_acts` (
  `id` int(11) NOT NULL,
  `offence_act_name` varchar(2000) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `offence_acts`
--

INSERT INTO `offence_acts` (`id`, `offence_act_name`, `status`, `created_at`, `updated_at`) VALUES
(3, 'The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd', 1, '2024-10-03 17:25:59', '2024-10-03 18:17:58'),
(4, 'The Dowry Prohibition Act, 1961', 1, '2024-10-03 17:25:59', '2024-10-03 17:26:31'),
(5, 'The Protection of Children from Sexual Offences (POCSO) Act, 2012', 1, '2024-10-03 17:25:59', '2024-10-03 17:25:59'),
(6, 'sadasdsadsad', 1, '2024-10-03 17:36:45', '2024-10-03 17:42:36'),
(7, 'dasdasd', 1, '2024-10-03 17:42:22', '2024-10-03 17:42:22'),
(8, 'new offinace', 1, '2024-10-03 17:47:42', '2024-10-03 17:47:42'),
(10, 'asdasd', 1, '2024-10-03 18:11:07', '2024-10-03 18:11:07'),
(11, 'asdsdasdasdasdasdasdasdasd', 1, '2024-10-03 18:11:16', '2024-10-03 18:11:16'),
(12, 'asddasd', 1, '2024-10-03 18:17:49', '2024-10-03 18:17:49'),
(13, 'Bala', 1, '2024-10-04 06:41:09', '2024-10-04 06:41:17');

-- --------------------------------------------------------

--
-- Table structure for table `otp_verification`
--

CREATE TABLE `otp_verification` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(320) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `otp_verification`
--

INSERT INTO `otp_verification` (`id`, `email`, `otp_code`, `expires_at`, `created_at`, `is_verified`) VALUES
(1, 'balasudhan17@gmail.com', '678984', '2024-09-29 09:15:45', '2024-09-29 09:10:45', 0),
(2, 'balasudhan17@gmail.com', '996058', '2024-09-29 09:16:53', '2024-09-29 09:11:53', 0),
(3, 'balasudhan17@gmail.com', '666105', '2024-09-29 09:14:53', '2024-09-29 09:14:32', 1),
(4, 'balasudhan17@gmail.com', '813315', '2024-09-29 09:24:10', '2024-09-29 09:24:02', 1),
(5, 'balasudhan17@gmail.com', '626666', '2024-09-29 09:32:35', '2024-09-29 09:31:51', 1),
(6, 'balathamizhiyan234@gmail.com', '418089', '2024-09-29 09:42:19', '2024-09-29 09:41:59', 1),
(7, 'balathamizhiyan234@gmail.com', '896468', '2024-09-29 09:43:51', '2024-09-29 09:43:40', 1),
(8, 'balasudhan17@gmail.com', '831442', '2024-09-29 09:53:37', '2024-09-29 09:53:16', 1),
(9, 'bala@gmail.com', '894833', '2024-10-13 16:29:24', '2024-10-13 16:24:24', 0),
(10, 'balathamizhiyan234@gmail.com', '646833', '2024-10-13 16:26:23', '2024-10-13 16:25:34', 1),
(11, 'balathamizhiyan234@gmail.com', '102105', '2024-10-14 06:22:42', '2024-10-14 06:17:42', 0),
(12, 'balathamizhiyan234@gmail.com', '193335', '2024-10-14 06:18:49', '2024-10-14 06:18:26', 1),
(13, 'balathamizhiyan234@gmail.com', '221641', '2024-10-15 05:28:10', '2024-10-15 05:23:10', 0);

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` int(11) NOT NULL,
  `permission_name` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `permission_name`, `status`) VALUES
(1, 'Dashboard', 1),
(2, 'User Management', 1),
(3, 'Users', 1),
(4, 'Roles', 1),
(5, 'Permissions', 1),
(6, 'Master Data', 1),
(7, 'District/City', 1),
(8, 'Revenue District', 1),
(9, 'Offence', 1),
(10, 'Offence Act for SC/ST', 1),
(13, 'Caste and Community', 1),
(14, 'FIR', 1),
(15, 'FIR List', 1),
(16, 'Add FIR', 1),
(17, 'Edit FIR', 1),
(18, 'View FIR', 1);

-- --------------------------------------------------------

--
-- Table structure for table `police_division`
--

CREATE TABLE `police_division` (
  `id` int(11) NOT NULL,
  `district_division_name` varchar(255) NOT NULL,
  `police_range_name` varchar(255) NOT NULL,
  `police_zone_name` varchar(255) NOT NULL,
  `revenue_district_name` varchar(500) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `police_division`
--

INSERT INTO `police_division` (`id`, `district_division_name`, `police_range_name`, `police_zone_name`, `revenue_district_name`, `status`) VALUES
(1, 'Chennai City', 'Commissionerates', 'Commissionerates', 'Chennai City', 1),
(2, 'Avadi City', 'Avadi City', 'Avadi City', 'Avadi City', 1),
(3, 'Tambaram City', 'Tambaram City', 'Tambaram City', 'Tambaram City', 1),
(4, 'Salem City', 'Salem City', 'Salem City', 'Salem City', 1),
(5, 'Coimbatore City', 'Coimbatore City', 'Coimbatore City', 'Coimbatore City', 1),
(6, 'Tiruppur City', 'Tiruppur City', 'Tiruppur City', 'Tiruppur City', 1),
(7, 'Trichy City', 'Trichy City', 'Trichy City', 'Trichy City', 1),
(8, 'Madurai City', 'Madurai City', 'Madurai City', 'Madurai City', 1),
(9, 'Tirunelveli City', 'Tirunelveli City', 'Tirunelveli City', 'Tirunelveli City', 1),
(10, 'Tiruvallur', 'Kanchipuram Range', 'North Zone', 'Tiruvallur', 1),
(11, 'Kanchipuram', 'Kanchipuram Range', 'North Zone', 'Kanchipuram', 1),
(12, 'Chengalpet', 'Kanchipuram Range', 'North Zone', 'Chengalpet', 1),
(13, 'Villupuram', 'Villupuram Rage', 'North Zone', 'Villupuram', 1),
(14, 'Kallakurichi', 'Villupuram Rage', 'North Zone', 'Kallakurichi', 1),
(15, 'Cuddalore', 'Villupuram Rage', 'North Zone', 'Cuddalore', 1),
(16, 'Vellore', 'Vellore Range', 'North Zone', 'Vellore', 1),
(17, 'Ranipet', 'Vellore Range', 'North Zone', 'Ranipet', 1),
(18, 'Thirupathur', 'Vellore Range', 'North Zone', 'Thirupathur', 1),
(19, 'Tiruvannamalai', 'Vellore Range', 'North Zone', 'Tiruvannamalai', 1),
(20, 'Salem District', 'Salem Range', 'West Zone', 'Salem District', 1),
(21, 'Namakkal', 'Salem Range', 'West Zone', 'Namakkal', 1),
(22, 'Krishnagiri', 'Salem Range', 'West Zone', 'Krishnagiri', 1),
(23, 'Dharmapuri', 'Salem Range', 'West Zone', 'Dharmapuri', 1),
(24, 'Coimbatore District', 'Coimbatore Range', 'West Zone', 'Coimbatore District', 1),
(25, 'Tiruppur District', 'Coimbatore Range', 'West Zone', 'Tiruppur District', 1),
(26, 'Erode', 'Coimbatore Range', 'West Zone', 'Erode', 1),
(27, 'Nilgiris', 'Coimbatore Range', 'West Zone', 'Nilgiris', 1),
(28, 'Trichy District', 'Trichy Range', 'Central Zone', 'Trichy District', 1),
(29, 'Pudukkottai', 'Trichy Range', 'Central Zone', 'Pudukkottai', 1),
(30, 'Karur', 'Trichy Range', 'Central Zone', 'Karur', 1),
(31, 'Perambalur', 'Trichy Range', 'Central Zone', 'Perambalur', 1),
(32, 'Ariyalur', 'Trichy Range', 'Central Zone', 'Ariyalur', 1),
(33, 'Thanjavur', 'Thanjavur Range', 'Central Zone', 'Thanjavur', 1),
(34, 'Thiruvarur', 'Thanjavur Range', 'Central Zone', 'Thiruvarur', 1),
(35, 'Nagapattinam', 'Thanjavur Range', 'Central Zone', 'Nagapattinam', 1),
(36, 'Mayiladuthurai', 'Thanjavur Range', 'Central Zone', 'Mayiladuthurai', 1),
(37, 'Dindigul', 'Dindigul Range', 'South Zone', 'Dindigul', 1),
(38, 'Theni', 'Dindigul Range', 'South Zone', 'Theni', 1),
(39, 'Madurai District', 'Madurai Range', 'South Zone', 'Madurai District', 1),
(40, 'Virudhunagar', 'Madurai Range', 'South Zone', 'Virudhunagar', 1),
(41, 'Ramanathapuram', 'Ramanad Range', 'South Zone', 'Ramanathapuram', 1),
(42, 'Sivagangai', 'Ramanad Range', 'South Zone', 'Sivagangai', 1),
(43, 'Tirunelveli District', 'Tirunelveli Range', 'South Zone', 'Tirunelveli District', 1),
(44, 'Thenkasi', 'Tirunelveli Range', 'South Zone', 'Thenkasi', 1),
(45, 'Thoothukudi', 'Tirunelveli Range', 'South Zone', 'Thoothukudi', 1),
(46, 'Kanniyakumari', 'Tirunelveli Range', 'South Zone', 'Kanniyakumari', 1),
(47, 'Ariyalur', 'Avadi City', 'Avadi City', NULL, 1),
(48, 'Nagapattinam', 'Velipalaiyam ', 'Nagore', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `rolepermissions`
--

CREATE TABLE `rolepermissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `has_permission` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rolepermissions`
--

INSERT INTO `rolepermissions` (`role_id`, `permission_id`, `has_permission`) VALUES
(1, 1, 1),
(1, 2, 1),
(1, 3, 1),
(1, 4, 1),
(1, 5, 1),
(1, 6, 1),
(1, 7, 1),
(1, 8, 1),
(1, 9, 1),
(1, 10, 1),
(1, 13, 1),
(1, 14, 1),
(1, 15, 1),
(1, 16, 1),
(1, 17, 1),
(1, 18, 1),
(2, 1, 1),
(2, 2, 1),
(2, 3, 1),
(2, 4, 1),
(2, 5, 1),
(3, 1, 1),
(3, 2, 0),
(3, 3, 0),
(3, 4, 0),
(3, 5, 0),
(3, 14, 1),
(3, 15, 1),
(3, 16, 1),
(3, 17, 1),
(3, 18, 1);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `status`) VALUES
(1, 'Super User ', 1),
(2, 'HO Users', 1),
(3, 'Users of SJ&HR wing', 1),
(4, 'Users of ADW&TW Dept chennai ', 1),
(7, 'District Collectors', 1),
(8, 'Nodal Users of IG (SJ&HR) TN Police, Directorate of ADW & TW', 1),
(9, 'Test 2', 1),
(11, 'Test 3', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `user_role_name` varchar(300) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `district` varchar(255) DEFAULT NULL,
  `profile_image_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` varchar(200) NOT NULL DEFAULT '1',
  `updatedBy` varchar(200) NOT NULL DEFAULT '1',
  `status` varchar(200) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `user_role_name`, `email`, `role`, `password`, `district`, `profile_image_path`, `created_at`, `updated_at`, `createdBy`, `updatedBy`, `status`) VALUES
(6, 'Bala', 'Secretary', 'balathamizhiyan234@gmail.com', '1', '$2a$10$FaDctrRlM14xhUrykNa3pO7.vJVsB7S5S9h.JnrdPtUWZ8Ghb0bd.', 'Dindigul', NULL, '2024-10-01 09:21:32', '2024-10-14 06:19:02', '1', '1', '1'),
(7, 'Balamugunthan', 'Secretary', 'bala1234@gmail.com', '3', '$2a$10$X1sbFvDbvNj3lz3BalZCiOfJ.JIvKDXLGc9u78/dc4rzq853yCmTG', 'Dindigul', NULL, '2024-10-01 10:17:41', '2024-10-11 06:24:37', '1', '1', '1'),
(9, 'Sharma', 'The users of the office of IG (SJ&HR) Tamil Nadu Police', 'Sharma IPS', '1', '$2a$10$FIyvzWEbeSRvJo57l0yR2eZEi4VQhogp.aBBSvgFcLt8XvDPEZnva', 'Coimbatore', NULL, '2024-10-01 11:51:23', '2024-10-01 11:54:33', '2', '2', '1'),
(10, 'Sema', 'The users of the office of IG (SJ&HR) Tamil Nadu Police', 'sema@gmail.com', '4', '$2a$10$wlGSCQYMEEh1xw/kbX0Xf.tJ62GXcdtkmyRdA9J/rIC6CZ79jalp6', 'Kallakurichi', NULL, '2024-10-08 11:23:24', '2024-10-08 11:23:24', '1', '1', '1'),
(11, 'Test', 'Director, TW Dept.', 'test@gmail.com', '2', '$2y$10$cK1Rht2p93Krrxw.T737t.izjQxLE5npPL/HIebRhi8QJC0Pb3TiG', 'Chennai', NULL, '2024-10-08 11:36:29', '2024-10-13 16:58:58', '1', '1', '1'),
(12, 'Balamugunthan', 'Secretary', 'balamugunthan@gmail.com', '9', '$2a$10$CyUB6xeFoRhWnRD2cLzSw.8hDPpcY0PEO0IL6QzWkXsIiHD338gAe', 'Kancheepuram', NULL, '2024-10-09 16:31:24', '2024-10-11 06:25:02', '1', '1', '1'),
(13, 'Test User', 'ADW&TW Dept.', 'testuser@1234.com', '3', '$2a$10$abcHEYThFkm9vVEnJuthv.uW3CELzx6JViH5iexX62WNFpZlViPUi', 'Chennai City', NULL, '2024-10-14 06:29:04', '2024-10-14 06:29:04', '1', '1', '1');

-- --------------------------------------------------------

--
-- Table structure for table `victims`
--

CREATE TABLE `victims` (
  `id` int(11) NOT NULL,
  `victim_id` varchar(10) DEFAULT NULL,
  `fir_id` varchar(6) DEFAULT NULL,
  `victim_name` varchar(100) DEFAULT NULL,
  `victim_age` int(11) DEFAULT NULL,
  `victim_gender` varchar(10) DEFAULT NULL,
  `mobile_number` varchar(10) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `victim_pincode` varchar(200) DEFAULT NULL,
  `community` varchar(50) DEFAULT NULL,
  `caste` varchar(50) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `is_native_district_same` enum('yes','no') DEFAULT NULL,
  `native_district` varchar(100) DEFAULT NULL,
  `offence_committed` varchar(255) DEFAULT NULL,
  `scst_sections` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `victims`
--

INSERT INTO `victims` (`id`, `victim_id`, `fir_id`, `victim_name`, `victim_age`, `victim_gender`, `mobile_number`, `address`, `victim_pincode`, `community`, `caste`, `guardian_name`, `is_native_district_same`, `native_district`, `offence_committed`, `scst_sections`) VALUES
(1, '5834i7', 'PfaDPZ', 'Balamugunthan S', 26, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(2, '5834i7', 'PfaDPZ', 'Balamugunthan S', 26, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(3, 'fCsowl', 'hQ0VKN', 'Surya', 52, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Protection of Children from Sexual Offences (POCSO) Act, 2012\",\"dasdasd\"]'),
(4, 'fCsowl', 'hQ0VKN', 'Surya', 52, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Protection of Children from Sexual Offences (POCSO) Act, 2012\",\"dasdasd\"]'),
(5, 'fCsowl', 'hQ0VKN', 'Surya', 52, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Protection of Children from Sexual Offences (POCSO) Act, 2012\",\"dasdasd\"]'),
(6, 'GzCvGI', 'azDrHr', 'Balamugunthan ', 23, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Test ', 'yes', NULL, '[\"Fraud\",\"Arson\"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(7, 'GzCvGI', 'azDrHr', 'Balamugunthan ', 23, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Test ', 'yes', NULL, '[\"Fraud\",\"Arson\"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(8, 'GzCvGI', 'azDrHr', 'Balamugunthan ', 23, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Test ', 'yes', NULL, '[\"Fraud\",\"Arson\"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(9, 'gnfXpJ', 'wlYiCd', 'Bala', 26, 'Male', '8056496398', 'chennai', '611002', 'SC', 'Thevar', 'bala', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(10, 'gnfXpJ', 'wlYiCd', 'Bala', 26, 'Male', '8056496398', 'chennai', '611002', 'SC', 'Thevar', 'bala', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(11, 'aPMBfS', 'NM6YwR', 'Bala', 56, 'Male', '8056496398', 'Chennai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"sadasdsadsad\",\"dasdasd\"]'),
(12, 'ZTHTve', 'SrHWRe', 'Bala', 29, 'Male', '8056496398', 'sadasd', '611002', 'SC', 'Thevar', 'asdasd', 'no', 'Mayiladuthurai', '[\"Fraud\",\"Arson\"]', '[\"The Protection of Children from Sexual Offences (POCSO) Act, 2012\",\"sadasdsadsad\"]'),
(13, 'gsFA5D', 'C35smE', 'asdsad', 23, 'Female', '8056496398', 'sdsd', '611002', 'SC', 'Thevar', 'sdsadsa', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(14, 'xtRoy0', 'Sjn7Xf', 'Bala', 23, 'Male', '8056496398', 'dsfsdf', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Protection of Children from Sexual Offences (POCSO) Act, 2012\",\"dasdasd\"]'),
(15, '0144vI', 'kOiwdF', 'Bala', 36, 'Male', '8056496398', 'Nagai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(16, '0144vI', 'kOiwdF', 'Bala', 36, 'Male', '8056496398', 'Nagai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(17, '0144vI', 'kOiwdF', 'Bala', 36, 'Male', '8056496398', 'Nagai', '611002', 'SC', 'Thevar', 'Chennai', 'yes', NULL, '[\"Theft\",\"Assault \"]', '[\"The Juvenile Justice (Care and Protection of Children) Act, 2015 asddsd\",\"The Dowry Prohibition Act, 1961\"]'),
(18, 'G0NgWV', 'kOiwdF', 'Mugunthan ', 36, 'Male', '8056496398', 'dsfsdf', '611002', 'SC', 'Thevar', 'dsfs', 'no', 'Perambalur', '[\"Fraud\",\"Arson\"]', '[\"The Protection of Children from Sexual Offences (POCSO) Act, 2012\",\"sadasdsadsad\"]'),
(19, '6LPbcL', 'ZuWzft', 'fdgdfg', 36, 'Female', '8056496398', 'sdfdsf', '611002', 'SC', 'Chettiar', 'Chennau', 'yes', NULL, '[\"Fraud\",\"Arson\"]', '[\"The Protection of Children from Sexual Offences (POCSO) Act, 2012\",\"sadasdsadsad\"]');

-- --------------------------------------------------------

--
-- Table structure for table `victim_relief`
--

CREATE TABLE `victim_relief` (
  `id` int(11) NOT NULL,
  `relief_id` varchar(36) DEFAULT NULL,
  `fir_id` varchar(36) NOT NULL,
  `victim_name` varchar(255) DEFAULT NULL,
  `community_certificate` enum('yes','no') DEFAULT NULL,
  `relief_amount_scst` decimal(10,2) DEFAULT NULL,
  `relief_amount_exgratia` decimal(10,2) DEFAULT NULL,
  `relief_amount_first_stage` decimal(10,2) DEFAULT NULL,
  `additional_relief` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_relief`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accuseds`
--
ALTER TABLE `accuseds`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `altered_case_details`
--
ALTER TABLE `altered_case_details`
  ADD PRIMARY KEY (`altered_case_id`),
  ADD KEY `fir_id` (`fir_id`);

--
-- Indexes for table `caste_community`
--
ALTER TABLE `caste_community`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `city`
--
ALTER TABLE `city`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `counter_case_details`
--
ALTER TABLE `counter_case_details`
  ADD PRIMARY KEY (`counter_case_id`),
  ADD KEY `fir_id` (`fir_id`);

--
-- Indexes for table `district`
--
ALTER TABLE `district`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `district_name` (`district_name`);

--
-- Indexes for table `district_revenue`
--
ALTER TABLE `district_revenue`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fir_add`
--
ALTER TABLE `fir_add`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fir_attachments`
--
ALTER TABLE `fir_attachments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fir_compensation`
--
ALTER TABLE `fir_compensation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `investigating_officers`
--
ALTER TABLE `investigating_officers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `offence`
--
ALTER TABLE `offence`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `offence_acts`
--
ALTER TABLE `offence_acts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `otp_verification`
--
ALTER TABLE `otp_verification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`);

--
-- Indexes for table `police_division`
--
ALTER TABLE `police_division`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rolepermissions`
--
ALTER TABLE `rolepermissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `victims`
--
ALTER TABLE `victims`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `victim_relief`
--
ALTER TABLE `victim_relief`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accuseds`
--
ALTER TABLE `accuseds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `altered_case_details`
--
ALTER TABLE `altered_case_details`
  MODIFY `altered_case_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `caste_community`
--
ALTER TABLE `caste_community`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `city`
--
ALTER TABLE `city`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `counter_case_details`
--
ALTER TABLE `counter_case_details`
  MODIFY `counter_case_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `district`
--
ALTER TABLE `district`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `district_revenue`
--
ALTER TABLE `district_revenue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `fir_add`
--
ALTER TABLE `fir_add`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `fir_attachments`
--
ALTER TABLE `fir_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fir_compensation`
--
ALTER TABLE `fir_compensation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investigating_officers`
--
ALTER TABLE `investigating_officers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `offence`
--
ALTER TABLE `offence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `offence_acts`
--
ALTER TABLE `offence_acts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `otp_verification`
--
ALTER TABLE `otp_verification`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `police_division`
--
ALTER TABLE `police_division`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `victims`
--
ALTER TABLE `victims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `victim_relief`
--
ALTER TABLE `victim_relief`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `altered_case_details`
--
ALTER TABLE `altered_case_details`
  ADD CONSTRAINT `altered_case_details_ibfk_1` FOREIGN KEY (`fir_id`) REFERENCES `fir` (`fir_id`) ON DELETE CASCADE;

--
-- Constraints for table `counter_case_details`
--
ALTER TABLE `counter_case_details`
  ADD CONSTRAINT `counter_case_details_ibfk_1` FOREIGN KEY (`fir_id`) REFERENCES `fir` (`fir_id`) ON DELETE CASCADE;

--
-- Constraints for table `rolepermissions`
--
ALTER TABLE `rolepermissions`
  ADD CONSTRAINT `rolepermissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  ADD CONSTRAINT `rolepermissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
